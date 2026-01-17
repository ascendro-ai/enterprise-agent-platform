import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle, AlertCircle, Clock, RefreshCw, ArrowLeft, MapPin, ThumbsUp, Share2 } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  status?: 'new' | 'draft' | 'posted' | 'flagged';
  draftResponse?: string;
  postedResponse?: string;
  profileInitial?: string;
}

interface Screen6DemoEnvironmentProps {
  orgChartData?: any;
  onTaskCreated?: (task: any) => void;
}

const Screen6DemoEnvironment: React.FC<Screen6DemoEnvironmentProps> = ({ orgChartData, onTaskCreated }) => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      name: "Sarah M.",
      rating: 5,
      date: "2 days ago",
      text: "Absolutely beautiful flowers! I ordered an arrangement for my anniversary, and it was perfect. Great service and stunning bouquet!",
      verified: true,
      status: 'posted',
      postedResponse: "Thank you so much, Sarah! We're thrilled you loved your anniversary arrangement. We appreciate your support!",
      profileInitial: 'S'
    },
    {
      id: '2',
      name: "Jason T.",
      rating: 5,
      date: "1 week ago",
      text: "Wonderful shop with a lovely selection. The flowers were fresh and lasted a long time. Highly recommend!",
      verified: true,
      status: 'posted',
      postedResponse: "Thank you, Jason! We're so glad the flowers lasted well for you. We look forward to serving you again!",
      profileInitial: 'J'
    },
    {
      id: '3',
      name: "Emily R.",
      rating: 4,
      date: "4 days ago",
      text: "Nice shop with friendly staff. The bouquet was pretty, though a bit smaller than expected.",
      verified: true,
      status: 'posted',
      postedResponse: "Thank you for your feedback, Emily! We appreciate you letting us know and will work to improve.",
      profileInitial: 'E'
    },
    {
      id: '4',
      name: "David L.",
      rating: 5,
      date: "3 days ago",
      text: "Fantastic experience! The flowers were gorgeous and delivered on time. Will definitely be back!",
      verified: true,
      status: 'posted',
      postedResponse: "We're so happy to hear that, David! Thank you for choosing us and we can't wait to serve you again!",
      profileInitial: 'D'
    }
  ]);

  const [isSimulating, setIsSimulating] = useState(true);
  const [businessName] = useState("Blossoms Flower Shop");
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const totalReviews = reviews.length;

  // Random review templates
  const reviewTemplates = [
    { text: "Absolutely beautiful flowers! I ordered an arrangement for my anniversary, and it was perfect. Great service and stunning bouquet!", rating: 5 },
    { text: "Wonderful shop with a lovely selection. The flowers were fresh and lasted a long time. Highly recommend!", rating: 5 },
    { text: "Nice shop with friendly staff. The bouquet was pretty, though a bit smaller than expected.", rating: 4 },
    { text: "Fantastic experience! The flowers were gorgeous and delivered on time. Will definitely be back!", rating: 5 },
    { text: "Great selection and friendly service. The delivery was on time and the flowers were fresh.", rating: 4 },
    { text: "Perfect for my wedding! They understood exactly what I wanted and delivered beyond expectations.", rating: 5 },
    { text: "The flowers I ordered were not as described. Some were wilted when they arrived. Disappointed.", rating: 2 },
    { text: "Best flower shop in Dallas! Always fresh, always beautiful. I come here for all my special occasions.", rating: 5 },
    { text: "Very satisfied with my purchase. The arrangement exceeded my expectations.", rating: 5 },
    { text: "Quick delivery and excellent quality. Will order again!", rating: 4 }
  ];

  const names = ["Sarah M.", "Jason T.", "Emily R.", "David L.", "Alex Martinez", "Jessica Brown", "Robert Lee", "Amanda White", "Michael Chen", "Lisa Anderson"];

  // Simulate new reviews coming in (for demo purposes)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Simulate a new review every 30 seconds
      const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      
      const newReview: Review = {
        id: Date.now().toString(),
        name: name,
        rating: template.rating,
        date: "Just now",
        text: template.text,
        verified: Math.random() > 0.3,
        status: 'new',
        profileInitial: name.charAt(0)
      };

      setReviews(prev => [newReview, ...prev]);
      
      // Notify Control Room if callback is provided
      if (onTaskCreated) {
        onTaskCreated({
          type: 'new_review',
          review: newReview,
          agent: 'AI Review Assistant',
          timestamp: new Date()
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isSimulating, onTaskCreated]);

  // Check for agents that should process reviews
  useEffect(() => {
    const reviewAgent = findReviewAgent(orgChartData);
    if (reviewAgent && reviewAgent.status === 'active') {
      // Auto-process new reviews if agent is active
      const newReviews = reviews.filter(r => r.status === 'new');
      newReviews.forEach((review, index) => {
        // Stagger the processing slightly
        setTimeout(() => {
          const draftResponse = generateDraftResponse(review);
          setReviews(prev => prev.map(r => 
            r.id === review.id 
              ? { ...r, status: 'draft', draftResponse: draftResponse }
              : r
          ));
          
          // Notify Control Room
          if (onTaskCreated) {
            onTaskCreated({
              type: 'review_drafted',
              review: review,
              agent: reviewAgent.name,
              timestamp: new Date()
            });
          }
        }, 2000 + (index * 500)); // Stagger by 500ms per review
      });
    }
  }, [reviews, orgChartData, onTaskCreated]);

  const findReviewAgent = (data: any): any => {
    if (!data) return null;
    if (data.name?.toLowerCase().includes('review') && data.type === 'ai') {
      return data;
    }
    if (data.children) {
      for (const child of data.children) {
        const found = findReviewAgent(child);
        if (found) return found;
      }
    }
    return null;
  };

  const generateDraftResponse = (review: Review): string => {
    if (review.rating >= 4) {
      return `Thank you so much, ${review.name}! We're thrilled to hear you loved your ${review.rating === 5 ? 'experience' : 'flowers'}. We appreciate your support and look forward to serving you again!`;
    } else {
      return `We sincerely apologize for the disappointing experience, ${review.name}. We'd like to make this right. Please contact us directly so we can resolve this issue and ensure your complete satisfaction.`;
    }
  };

  const handlePostResponse = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return { 
          ...r, 
          status: 'posted',
          postedResponse: r.draftResponse || r.postedResponse,
          draftResponse: undefined
        };
      }
      return r;
    }));
    
    if (onTaskCreated) {
      const review = reviews.find(r => r.id === reviewId);
      onTaskCreated({
        type: 'review_posted',
        review: review,
        agent: 'AI Review Assistant',
        timestamp: new Date()
      });
    }
  };

  // Auto-post draft responses after a delay (simulating agent auto-posting)
  useEffect(() => {
    const reviewAgent = findReviewAgent(orgChartData);
    if (reviewAgent && reviewAgent.status === 'active') {
      const draftReviews = reviews.filter(r => r.status === 'draft' && r.draftResponse);
      draftReviews.forEach((review, index) => {
        // Auto-post after 5 seconds (simulating approval workflow)
        setTimeout(() => {
          setReviews(prev => prev.map(r => 
            r.id === review.id 
              ? { 
                  ...r, 
                  status: 'posted',
                  postedResponse: r.draftResponse,
                  draftResponse: undefined
                }
              : r
          ));
        }, 5000 + (index * 1000));
      });
    }
  }, [reviews, orgChartData]);

  const handleFlagReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, status: 'flagged' } : r
    ));
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Mobile-style Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🌺</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{businessName}</h1>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1">
            Directions
            <MapPin size={14} />
          </button>
        </div>
        
        {/* Shop Images Preview */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 h-32 bg-gradient-to-br from-yellow-100 to-pink-100 rounded-lg"></div>
          <div className="flex-1 h-32 bg-gradient-to-br from-pink-100 to-red-100 rounded-lg"></div>
          <div className="flex-1 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg"></div>
        </div>

        {/* Google Reviews Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-900">Google Reviews</span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-sm text-gray-600">{totalReviews} Reviews</span>
        </div>

        {/* Simulation Toggle */}
        <div className="flex items-center justify-end mt-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              isSimulating
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isSimulating ? (
              <>
                <X size={12} />
                Stop
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                Start
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-lg p-4 ${
                review.status === 'new' ? 'border-l-4 border-blue-500' :
                review.status === 'draft' ? 'border-l-4 border-yellow-500' :
                'border-l-4 border-transparent'
              }`}
            >
              {/* Review Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {review.profileInitial || review.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{review.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
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

              {/* Review Text */}
              <p className="text-gray-700 mb-3 text-sm leading-relaxed">{review.text}</p>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mb-3">
                <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-xs">
                  <ThumbsUp size={14} />
                  Like
                </button>
                <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-xs">
                  <Share2 size={14} />
                  Share
                </button>
              </div>

              {/* Posted Response (from business) */}
              {review.postedResponse && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-xs font-bold">
                      🌺
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{businessName}</span>
                        <span className="text-xs text-gray-500">Owner</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{review.postedResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Draft Response (waiting for approval) */}
              {review.draftResponse && !review.postedResponse && (
                <div className="mt-3 pt-3 border-t border-yellow-200 bg-yellow-50/50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-xs font-bold">
                      🌺
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{businessName}</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Draft</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{review.draftResponse}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePostResponse(review.id)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          <CheckCircle size={12} />
                          Post
                        </button>
                        <button
                          onClick={() => handleFlagReview(review.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                        >
                          Flag
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for agent processing */}
              {review.status === 'new' && !review.draftResponse && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>AI agent is processing this review...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-3">
        <p className="text-xs text-gray-500 text-center">
          Demo Environment • Reviews update automatically when agents respond
        </p>
      </div>
    </div>
  );
};

export default Screen6DemoEnvironment;
