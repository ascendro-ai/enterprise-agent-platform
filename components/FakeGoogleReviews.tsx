import React from 'react';
import { X, Star } from 'lucide-react';

interface FakeGoogleReviewsProps {
  onClose: () => void;
  businessName?: string;
}

const FakeGoogleReviews: React.FC<FakeGoogleReviewsProps> = ({ onClose, businessName = "Dallas Flower Shop" }) => {
  const reviews = [
    {
      name: "Sarah Johnson",
      rating: 5,
      date: "2 weeks ago",
      text: "Absolutely beautiful arrangements! The staff was so helpful and the flowers lasted over a week. Highly recommend!",
      verified: true
    },
    {
      name: "Michael Chen",
      rating: 4,
      date: "1 month ago",
      text: "Great selection and friendly service. The delivery was on time and the flowers were fresh.",
      verified: true
    },
    {
      name: "Emily Rodriguez",
      rating: 5,
      date: "3 weeks ago",
      text: "Perfect for my wedding! They understood exactly what I wanted and delivered beyond expectations.",
      verified: true
    },
    {
      name: "David Thompson",
      rating: 2,
      date: "1 week ago",
      text: "The flowers I ordered were not as described. Some were wilted when they arrived. Disappointed.",
      verified: false
    },
    {
      name: "Lisa Anderson",
      rating: 5,
      date: "2 months ago",
      text: "Best flower shop in Dallas! Always fresh, always beautiful. I come here for all my special occasions.",
      verified: true
    },
    {
      name: "Robert Martinez",
      rating: 3,
      date: "3 weeks ago",
      text: "Decent selection but a bit pricey. The quality is good though.",
      verified: true
    }
  ];

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const totalReviews = reviews.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{businessName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-lg font-semibold">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-600">({totalReviews} reviews)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {reviews.map((review, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{review.name}</span>
                        {review.verified && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-3 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            This is a demo Google Reviews page. Reviews are simulated for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FakeGoogleReviews;
