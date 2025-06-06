import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const faqResponses = {
  booking:
    'To make a booking, browse our offers page, select a package, and click "Get Tickets". Follow the form to complete your reservation. You\'ll receive a confirmation email once booked.',
  payment:
    "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal. Payment is processed immediately upon booking confirmation.",
  cancellation:
    "You can modify or cancel your booking up to 48 hours before your travel date. Full refunds are available for cancellations made 7+ days before travel.",
  pricing:
    "Our pricing is per passenger (pax) and includes: 12-hour private tour, dedicated tour assistant, private van transportation, gas & toll fees, hotel pick-up/drop-off, and multilingual driver.",
  driver:
    "After booking confirmation, you'll receive detailed driver information including name, contact number, and languages spoken (English, Japanese, Tagalog).",
  weather:
    "We monitor weather conditions closely. In case of severe weather, we'll contact you to reschedule or provide a full refund.",
  contact:
    "You can reach us at unclesamtourservices1988@gmail.com or call +81 80-5331-1738 for reservations and inquiries.",
  languages:
    "Our drivers are fluent in English, Japanese, and Tagalog to ensure clear communication throughout your tour.",
  pickup:
    "We provide hotel pick-up and drop-off service. Be ready at your hotel lobby at the scheduled time.",
  duration:
    "All our tours are 12-hour private tours with a dedicated tour assistant.",
};

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your UncleSam Tours assistant. I can help you with questions about bookings, payments, cancellations, and travel policies. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (query: string): string => {
    const lowercaseQuery = query.toLowerCase();

    for (const [keyword, response] of Object.entries(faqResponses)) {
      if (lowercaseQuery.includes(keyword)) {
        return response;
      }
    }

    // Default response
    return "I'm here to help with questions about bookings, payments, cancellations, pricing, drivers, and travel policies. You can also contact us directly at unclesamtourservices1988@gmail.com or +81 80-5331-1738 for personalized assistance.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: findBestResponse(inputText),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg z-50 p-0"
        aria-label="Open FAQ Chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-96 shadow-2xl z-50 bg-white border-red-200">
      <CardHeader className="bg-red-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-1">
              <Bot className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                UncleSam Tours Assistant
              </CardTitle>
              <p className="text-xs text-red-100">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-red-700 p-1 h-auto"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-700 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-64 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === "bot" && (
                        <Bot className="w-4 h-4 mt-0.5 text-red-600" />
                      )}
                      {message.sender === "user" && (
                        <User className="w-4 h-4 mt-0.5 text-white" />
                      )}
                      <div>
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "user"
                              ? "text-red-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-red-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about bookings, payments, etc..."
                className="flex-1 text-sm"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-red-600 hover:bg-red-700 text-white p-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
