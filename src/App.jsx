import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import {
  Heart, TrendingUp, AlertCircle, CheckCircle, MessageCircle, Lock,
  Star, ThumbsUp, ThumbsDown, ClipboardList, LayoutDashboard
} from "lucide-react";

const firebaseConfig = {
  apiKey: "AIzaSyC54hJuYst9OyowZYElRSlaXrbgvSzhqq4",
  authDomain: "project-3387875257074639896.firebaseapp.com",
  projectId: "project-3387875257074639896",
  storageBucket: "project-3387875257074639896.firebasestorage.app",
  messagingSenderId: "384350098819",
  appId: "1:384350098819:web:152e289cfa99ba672112b6",
  measurementId: "G-JTZH2P1TPG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const DASHBOARD_PASSWORD = "1618admin";

// Red outline star rating component (no emoji)
const StarRating = ({ rating, setRating }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => setRating(star)}
        className="transition transform hover:scale-110 focus:outline-none"
        aria-label={`${star} star`}
      >
        <Star
          size={36}
          strokeWidth={1.5}
          className={star <= rating ? "text-red-600 fill-red-100" : "text-gray-300"}
        />
      </button>
    ))}
  </div>
);

export default function FeedbackApp() {
  const [currentPage, setCurrentPage] = useState("survey");
  const [formData, setFormData] = useState({
    rating: 5, nps: 8, greatPart: "", needsWork: "", firstVisit: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [metrics, setMetrics] = useState({ npsScore: 0, avgRating: 0, total: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    if (currentPage === "dashboard" && isAuthenticated) loadFeedback();
  }, [currentPage, isAuthenticated]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === DASHBOARD_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  const loadFeedback = async () => {
    try {
      const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFeedbackList(data);
      if (data.length > 0) {
        const avgRating = data.reduce((sum, d) => sum + d.rating, 0) / data.length;
        const promoters = data.filter((d) => d.nps >= 9).length;
        const detractors = data.filter((d) => d.nps <= 6).length;
        const nps = Math.round(((promoters - detractors) / data.length) * 100);
        setMetrics({ npsScore: nps, avgRating: avgRating.toFixed(1), total: data.length });
      }
    } catch (err) {
      console.error("Error loading feedback:", err);
    }
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        rating: formData.rating,
        nps: formData.nps,
        greatPart: formData.greatPart,
        needsWork: formData.needsWork,
        firstVisit: formData.firstVisit,
        timestamp: new Date(),
        segment: formData.nps >= 9 ? "promoter" : formData.nps >= 7 ? "passive" : "detractor",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ rating: 5, nps: 8, greatPart: "", needsWork: "", firstVisit: false });
      }, 3000);
    } catch (err) {
      console.error("Error saving feedback:", err);
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const PasswordGate = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-red-600" size={24} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Staff Only</h2>
          <p className="text-gray-400 text-sm mt-1">Enter your password to view the dashboard</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 ${
              passwordError ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
            autoFocus
          />
          {passwordError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={14} strokeWidth={1.5} />
              Incorrect password. Try again.
            </div>
          )}
          <button type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition"
          >
            Access Dashboard
          </button>
          <button type="button" onClick={() => setCurrentPage("survey")}
            className="w-full text-gray-400 text-sm hover:text-gray-600 transition"
          >
            Back to survey
          </button>
        </form>
      </div>
    </div>
  );

  if (currentPage === "dashboard" && !isAuthenticated) return <PasswordGate />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">

      {/* Nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <img
            src="/1618_logo_transparent.png"
            alt="1618 Asian Fusion"
            className="h-12 w-auto object-contain"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage("survey")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                currentPage === "survey"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "text-gray-500 border-transparent hover:bg-gray-50"
              }`}
            >
              <ClipboardList size={15} strokeWidth={1.5} />
              Share Feedback
            </button>
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                currentPage === "dashboard"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "text-gray-500 border-transparent hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard size={15} strokeWidth={1.5} />
              Staff Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {currentPage === "survey" ? (

          /* SURVEY */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-8">
                <img
                  src="/1618_logo_transparent.png"
                  alt="1618 Asian Fusion"
                  className="h-20 w-auto object-contain mx-auto mb-4"
                />
                <h1 className="text-2xl font-semibold text-gray-800">How was your visit?</h1>
                <p className="text-gray-400 text-sm mt-1">Your feedback helps us improve</p>
              </div>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-500" size={32} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Thank you!</h2>
                  <p className="text-gray-400 text-sm">We appreciate you taking the time</p>
                </div>
              ) : (
                <form onSubmit={handleSurveySubmit} className="space-y-6">

                  {/* Star rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-3">Rate your meal</label>
                    <StarRating
                      rating={formData.rating}
                      setRating={(val) => setFormData({ ...formData, rating: val })}
                    />
                  </div>

                  {/* NPS slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-3">
                      How likely are you to recommend us?{" "}
                      <span className="text-red-600 font-semibold">{formData.nps}/10</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <ThumbsDown size={16} strokeWidth={1.5} className="text-gray-300 flex-shrink-0" />
                      <input type="range" min="0" max="10" value={formData.nps}
                        onChange={(e) => setFormData({ ...formData, nps: parseInt(e.target.value) })}
                        className="flex-1 accent-red-600"
                      />
                      <ThumbsUp size={16} strokeWidth={1.5} className="text-red-400 flex-shrink-0" />
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                        formData.nps >= 9
                          ? "bg-green-50 text-green-600 border-green-200"
                          : formData.nps >= 7
                          ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {formData.nps >= 9 ? "Promoter" : formData.nps >= 7 ? "Passive" : "Detractor"}
                      </span>
                    </div>
                  </div>

                  {/* What was great */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <ThumbsUp size={14} strokeWidth={1.5} className="text-red-400" />
                      What did you enjoy?
                    </label>
                    <textarea value={formData.greatPart}
                      onChange={(e) => setFormData({ ...formData, greatPart: e.target.value })}
                      placeholder="E.g., Amazing spice level, friendly staff..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                      rows="2"
                    />
                  </div>

                  {/* What needs work */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <ThumbsDown size={14} strokeWidth={1.5} className="text-gray-400" />
                      What can we improve?
                    </label>
                    <textarea value={formData.needsWork}
                      onChange={(e) => setFormData({ ...formData, needsWork: e.target.value })}
                      placeholder="E.g., Wait time, portion size..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                      rows="2"
                    />
                  </div>

                  {/* First visit */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.firstVisit}
                      onChange={(e) => setFormData({ ...formData, firstVisit: e.target.checked })}
                      className="w-4 h-4 rounded accent-red-600"
                    />
                    <span className="text-sm text-gray-600">This is my first visit</span>
                  </label>

                  <button type="submit" disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {loading ? "Saving..." : "Submit Feedback"}
                  </button>
                </form>
              )}
            </div>
          </div>

        ) : (

          /* DASHBOARD */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <LayoutDashboard size={22} strokeWidth={1.5} className="text-red-600" />
                <h1 className="text-xl font-semibold text-gray-800">1618 Feedback Dashboard</h1>
              </div>
              <button onClick={() => { setIsAuthenticated(false); setCurrentPage("survey"); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                <Lock size={12} strokeWidth={1.5} /> Lock
              </button>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">NPS Score</p>
                  <p className="text-4xl font-semibold text-red-600 mt-1">{metrics.npsScore}</p>
                  <p className="text-xs text-gray-400 mt-1">Industry avg: 50</p>
                </div>
                <TrendingUp size={36} strokeWidth={1.5} className="text-green-400" />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Avg Rating</p>
                  <p className="text-4xl font-semibold text-yellow-500 mt-1">{metrics.avgRating}</p>
                  <p className="text-xs text-gray-400 mt-1">out of 5.0</p>
                </div>
                <Star size={36} strokeWidth={1.5} className="text-yellow-400" />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total Responses</p>
                  <p className="text-4xl font-semibold text-blue-500 mt-1">{metrics.total}</p>
                  <p className="text-xs text-gray-400 mt-1">responses collected</p>
                </div>
                <MessageCircle size={36} strokeWidth={1.5} className="text-blue-400" />
              </div>
            </div>

            {/* Feedback list */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Recent Feedback</h2>
              {feedbackList.length === 0 ? (
                <div className="text-center py-10">
                  <MessageCircle size={32} strokeWidth={1.5} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No feedback yet — share your QR code to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackList.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {item.segment === "promoter"
                          ? <CheckCircle size={18} strokeWidth={1.5} className="text-green-400" />
                          : item.segment === "detractor"
                          ? <AlertCircle size={18} strokeWidth={1.5} className="text-red-400" />
                          : <MessageCircle size={18} strokeWidth={1.5} className="text-yellow-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-2 mb-1.5 flex-wrap items-center">
                          <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                            <Star size={10} strokeWidth={1.5} className="text-yellow-400" /> {item.rating}/5
                          </span>
                          <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">NPS {item.nps}</span>
                          {item.firstVisit && (
                            <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full border border-blue-100">First visit</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                            item.segment === "promoter" ? "bg-green-50 text-green-600 border-green-100"
                            : item.segment === "detractor" ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-yellow-50 text-yellow-600 border-yellow-100"
                          }`}>{item.segment}</span>
                        </div>
                        {item.greatPart && (
                          <p className="flex items-start gap-1.5 text-sm text-gray-700">
                            <ThumbsUp size={13} strokeWidth={1.5} className="text-green-400 mt-0.5 flex-shrink-0" />
                            {item.greatPart}
                          </p>
                        )}
                        {item.needsWork && (
                          <p className="flex items-start gap-1.5 text-sm text-gray-500 mt-1">
                            <ThumbsDown size={13} strokeWidth={1.5} className="text-red-400 mt-0.5 flex-shrink-0" />
                            {item.needsWork}
                          </p>
                        )}
                        <p className="text-xs text-gray-300 mt-1">
                          {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : "Just now"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
