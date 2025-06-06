import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Bot,
  Cloud,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface AIService {
  name: string;
  status: "online" | "offline" | "warning";
  lastUpdate: string;
  responseTime: string;
  requestsToday: number;
  description: string;
}

export default function AIIntegrationStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [services, setServices] = useState<AIService[]>([
    {
      name: "FAQ Chatbot",
      status: "online",
      lastUpdate: new Date().toLocaleString(),
      responseTime: "120ms",
      requestsToday: 47,
      description: "Persistent FAQ assistance chatbot",
    },
    {
      name: "Itinerary AI",
      status: "online",
      lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toLocaleString(),
      responseTime: "350ms",
      requestsToday: 23,
      description: "Personalized itinerary generation",
    },
    {
      name: "Weather API",
      status: "warning",
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toLocaleString(),
      responseTime: "1.2s",
      requestsToday: 156,
      description: "Real-time weather monitoring",
    },
    {
      name: "PDF Generator",
      status: "online",
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(),
      responseTime: "890ms",
      requestsToday: 12,
      description: "Branded itinerary PDF export",
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "offline":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "offline":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Simulate API status check
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update timestamps and simulate some status changes
    setServices((prev) =>
      prev.map((service) => ({
        ...service,
        lastUpdate: new Date().toLocaleString(),
        responseTime: `${Math.floor(Math.random() * 500) + 100}ms`,
        requestsToday: service.requestsToday + Math.floor(Math.random() * 5),
      })),
    );

    setIsRefreshing(false);
  };

  const totalRequests = services.reduce(
    (sum, service) => sum + service.requestsToday,
    0,
  );
  const onlineServices = services.filter(
    (service) => service.status === "online",
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="w-5 h-5 text-blue-600" />
            <CardTitle>AI Integration Status</CardTitle>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {onlineServices}/{services.length}
            </p>
            <p className="text-sm text-gray-600">Services Online</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Cloud className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
            <p className="text-sm text-gray-600">Requests Today</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">99.2%</p>
            <p className="text-sm text-gray-600">Uptime</p>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-4">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(service.status)}
                <div>
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-right">
                <div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status.toUpperCase()}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {service.responseTime} avg
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {service.requestsToday} requests
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated: {service.lastUpdate.split(",")[1]?.trim()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Test Controls */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Test AI Services</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300"
            >
              Test FAQ Chatbot
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300"
            >
              Test Itinerary AI
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300"
            >
              Check Weather API
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300"
            >
              Generate Test PDF
            </Button>
          </div>
        </div>

        {/* Last System Check */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Last system check: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
