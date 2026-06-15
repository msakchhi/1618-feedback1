import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { Heart, TrendingUp, AlertCircle, CheckCircle, MessageCircle } from "lucide-react";

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

export default function FeedbackApp() {
  const [currentPage, setCurrentPage] = useState("survey");
  const [formData, setFormData] = useState({
    rating: 5,
    nps: 8,
    greatPart: "",
    needsWork: "",
    firstVisit: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [metrics, setMetrics] = useState({ npsScore: 0, avgRating: 0, total: 0 });

  useEffect(() => {
    if (currentPage === "dashboard") {
      loadFeedback();
    }
  }, [currentPage]);

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
        setMetrics({
          npsScore: nps,
          avgRating: avgRating.toFixed(1),
          total: data.length,
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-4 justify-center">
          <button
            onClick={() => setCurrentPage("survey")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              currentPage === "survey" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📝 Feedback Form
          </button>
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              currentPage === "dashboard" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📊 Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {currentPage === "survey" ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">1618 Asian Fusion</h1>
                <p className="text-gray-500 mt-2">Help us serve you better 🍜</p>
              </div>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✨</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">Thank you!</h2>
                  <p className="text-gray-600">Your feedback helps us improve</p>
                </div>
              ) : (
                <form onSubmit={handleSurveySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      How was your meal? ⭐
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className={`text-4xl transition transform hover:scale-110 ${
                            star <= formData.rating ? "opacity-100" : "opacity-30"
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      How likely to recommend 1618 to a friend? (0–10)
                    </label>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Not likely</span>
                      <input
                        type="range" min="0" max="10"
                        value={formData.nps}
                        onChange={(e) => setFormData({ ...formData, nps: parseInt(e.target.value) })}
                        className="flex-1 mx-4 accent-red-600"
                      />
                      <span className="text-xs text-gray-500">Very likely</span>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-3xl font-bold text-red-600">{formData.nps}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {formData.nps >= 9 ? "⭐ Promoter" : formData.nps >= 7 ? "😊 Passive" : "⚠️ Detractor"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What was great? ✨</label>
                    <textarea
                      value={formData.greatPart}
                      onChange={(e) => setFormData({ ...formData, greatPart: e.target.value })}
                      placeholder="E.g., Amazing spice level, friendly staff..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What can we improve? 🛠️</label>
                    <textarea
                      value={formData.needsWork}
                      onChange={(e) => setFormData({ ...formData, needsWork: e.target.value })}
                      placeholder="E.g., Wait time, portion size..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="2"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.firstVisit}
                      onChange={(e) => setFormData({ ...formData, firstVisit: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">This is my first visit</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    {loading ? "Saving..." : "Submit Feedback"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">📊 1618 Feedback Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">NPS Score</p>
                  <p className="text-4xl font-bold text-red-600 mt-1">{metrics.npsScore}</p>
                  <p className="text-xs text-gray-400 mt-1">Industry avg: 50</p>
                </div>
                <TrendingUp className="text-green-500" size={40} />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Avg Rating</p>
                  <p className="text-4xl font-bold text-yellow-500 mt-1">{metrics.avgRating}</p>
                  <p className="text-xs text-gray-400 mt-1">out of 5.0</p>
                </div>
                <Heart className="text-red-500" size={40} />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Responses</p>
                  <p className="text-4xl font-bold text-blue-600 mt-1">{metrics.total}</p>
                  <p className="text-xs text-gray-400 mt-1">responses collected</p>
                </div>
                <MessageCircle className="text-blue-500" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Feedback</h2>
              {feedbackList.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No feedback yet — share the survey link to get started! 🎉
                </p>
              ) : (
                <div className="space-y-4">
                  {feedbackList.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        {item.segment === "promoter" ? (
                          <CheckCircle className="text-green-500" size={20} />
                        ) : item.segment === "detractor" ? (
                          <AlertCircle className="text-red-500" size={20} />
                        ) : (
                          <MessageCircle className="text-yellow-500" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">⭐ {item.rating}/5</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">NPS: {item.nps}</span>
                          {item.firstVisit && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">First visit</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            item.segment === "promoter" ? "bg-green-100 text-green-700"
                            : item.segment === "detractor" ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {item.segment}
                          </span>
                        </div>
                        {item.greatPart && <p className="text-sm text-green-700">✅ {item.greatPart}</p>}
                        {item.needsWork && <p className="text-sm text-red-700">⚠️ {item.needsWork}</p>}
                        <p className="text-xs text-gray-400 mt-1">
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
