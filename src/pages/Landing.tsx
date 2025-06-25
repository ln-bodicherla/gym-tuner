import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Menu, X, Smartphone, Brain, Target, TrendingUp, Star, Crown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { AnalyticsButton } from "@/components/AnalyticsButton";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Suggestions",
      description: "Get personalized workout recommendations based on your goals, injuries, and preferences."
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and track your fitness goals with detailed progress monitoring."
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Visualize your fitness journey with comprehensive stats and insights."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Access your workouts anywhere with our responsive mobile design."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      content: "Gym Tuner's AI suggestions have completely transformed my workout routine. I've never been more motivated!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Personal Trainer",
      content: "The injury tracking feature is invaluable. It helps me create safer, more effective programs for my clients.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Busy Professional",
      content: "Finally, a fitness app that understands my time constraints and gives me workouts that actually work.",
      rating: 5
    }
  ];

  const proFeatures = [
    "Unlimited AI-generated workout plans",
    "Advanced progress analytics", 
    "Personalized goal tracking",
    "Priority support",
    "Advanced workout analytics",
    "Personalized injury management",
    "Unlimited AI-powered suggestions"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/5e825f2e-98c7-4e9c-87a9-1b104539f992.png" 
                alt="Gym Tuner Logo" 
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold text-gray-900">Gym Tuner</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</a>
              <Link to="/auth">
                <AnalyticsButton 
                  variant="outline" 
                  className="mr-4"
                  eventName="nav_signin_click"
                >
                  Sign In
                </AnalyticsButton>
              </Link>
              <Link to="/auth">
                <AnalyticsButton 
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                  eventName="nav_getstarted_click"
                >
                  Get Started
                </AnalyticsButton>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2">Pricing</a>
                <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2">Testimonials</a>
                <div className="px-4 pt-4 border-t space-y-2">
                  <Link to="/auth" className="block">
                    <AnalyticsButton 
                      variant="outline" 
                      className="w-full"
                      eventName="mobile_signin_click"
                    >
                      Sign In
                    </AnalyticsButton>
                  </Link>
                  <Link to="/auth" className="block">
                    <AnalyticsButton 
                      className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                      eventName="mobile_getstarted_click"
                    >
                      Get Started
                    </AnalyticsButton>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Your AI-Powered
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                Fitness Companion
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your fitness journey with personalized AI workout suggestions, intelligent goal tracking, 
              and comprehensive progress analytics. Start your transformation today.
            </p>
            <div className="flex justify-center">
              <Link to="/auth">
                <AnalyticsButton 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 px-8 py-3 text-lg"
                  eventName="hero_start_journey_click"
                >
                  Start Your Journey
                </AnalyticsButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Gym Tuner combines cutting-edge AI technology with proven fitness principles 
              to deliver a truly personalized experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-100 to-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section - Only Pro Plan */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Transform Your Fitness Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get full access to all premium features and unlock your potential.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Pro Plan */}
            <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <Crown className="h-4 w-4" />
                  <span>Premium Plan</span>
                </div>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2 flex items-center justify-center space-x-2">
                  <Crown className="h-6 w-6 text-orange-500" />
                  <span>Gym Tuner Pro</span>
                </CardTitle>
                <CardDescription className="text-gray-700 mb-4">
                  Unlock your full potential
                </CardDescription>
                <div className="text-4xl font-bold text-gray-900">$9.99</div>
                <div className="text-gray-600">/month</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {proFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/auth" className="block">
                  <AnalyticsButton 
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                    eventName="pricing_subscribe_click"
                    eventData={{ plan: 'pro', price: 9.99 }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Subscribe Now
                  </AnalyticsButton>
                </Link>
                
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-500">
                    Cancel anytime • No commitments
                  </p>
                  <p className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    💰 Full refund within 7 days after purchase
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Gym Tuner?
              </h2>
              <div className="space-y-4">
                {[
                  "Personalized AI workout recommendations",
                  "Comprehensive injury tracking and prevention",
                  "Smart goal setting and progress monitoring",
                  "Mobile-optimized for on-the-go access",
                  "Data-driven insights and analytics",
                  "Seamless workout planning and execution"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6">
                    Start Your Fitness Journey Today
                  </h3>
                  <Link to="/auth">
                    <AnalyticsButton 
                      variant="secondary" 
                      size="lg" 
                      className="w-full"
                      eventName="benefits_getstarted_click"
                    >
                      Get Started Today
                    </AnalyticsButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what real users have to say about their Gym Tuner experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/lovable-uploads/5e825f2e-98c7-4e9c-87a9-1b104539f992.png" 
                  alt="Gym Tuner Logo" 
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="text-xl font-bold">Gym Tuner</span>
              </div>
              <p className="text-gray-400 mb-4">
                Your AI-powered fitness companion for a healthier, stronger you.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><a href="mailto:support@gymtuner.com" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Gym Tuner. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
