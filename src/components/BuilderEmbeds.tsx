// Builder.io Custom Code Blocks for AI Integration

// FAQ Chatbot Embed Code for Builder.io
export const FAQChatbotEmbed = `
<div id="unclesam-faq-chatbot">
  <style>
    #unclesam-faq-chatbot {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }
    
    .chatbot-button {
      width: 56px;
      height: 56px;
      background: #dc2626;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    }
    
    .chatbot-button:hover {
      background: #b91c1c;
      transform: scale(1.05);
    }
    
    .chatbot-icon {
      color: white;
      width: 24px;
      height: 24px;
    }
    
    .chatbot-window {
      display: none;
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 384px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      flex-direction: column;
    }
    
    .chatbot-header {
      background: #dc2626;
      color: white;
      padding: 16px;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .chatbot-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }
    
    .chatbot-input {
      border-top: 1px solid #e5e7eb;
      padding: 16px;
      display: flex;
      gap: 8px;
    }
    
    .message-bubble {
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 80%;
    }
    
    .message-bot {
      background: #f3f4f6;
      color: #1f2937;
      align-self: flex-start;
    }
    
    .message-user {
      background: #dc2626;
      color: white;
      align-self: flex-end;
      margin-left: auto;
    }
  </style>
  
  <div class="chatbot-button" onclick="toggleChatbot()">
    <svg class="chatbot-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
  </div>
  
  <div id="chatbot-window" class="chatbot-window">
    <div class="chatbot-header">
      <div>
        <div style="font-weight: bold;">UncleSam Tours Assistant</div>
        <div style="font-size: 12px; opacity: 0.8;">Online</div>
      </div>
      <button onclick="toggleChatbot()" style="background: none; border: none; color: white; cursor: pointer;">×</button>
    </div>
    
    <div class="chatbot-body" id="chat-messages">
      <div class="message-bubble message-bot">
        Hello! I'm your UncleSam Tours assistant. Ask me about bookings, payments, or tour information!
      </div>
    </div>
    
    <div class="chatbot-input">
      <input type="text" id="user-input" placeholder="Ask about bookings, payments..." style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" onkeypress="handleKeyPress(event)">
      <button onclick="sendMessage()" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Send</button>
    </div>
  </div>
</div>

<script>
function toggleChatbot() {
  const window = document.getElementById('chatbot-window');
  if (window.style.display === 'none' || window.style.display === '') {
    window.style.display = 'flex';
  } else {
    window.style.display = 'none';
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;
  
  addMessage(message, 'user');
  input.value = '';
  
  // Simulate bot response
  setTimeout(() => {
    const response = getBotResponse(message);
    addMessage(response, 'bot');
  }, 1000);
}

function addMessage(text, sender) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = \`message-bubble message-\${sender}\`;
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function getBotResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('booking')) {
    return 'To make a booking, browse our offers page, select a package, and click "Get Tickets". You\\'ll receive confirmation once booked.';
  } else if (lowerMessage.includes('payment')) {
    return 'We accept all major credit cards, debit cards, and PayPal. Payment is processed immediately upon booking.';
  } else if (lowerMessage.includes('cancellation')) {
    return 'You can cancel up to 48 hours before travel. Full refunds available for cancellations 7+ days before travel.';
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return 'Our pricing is per passenger (pax) and includes 12-hour private tour, van transportation, gas, tolls, and multilingual driver.';
  } else if (lowerMessage.includes('driver')) {
    return 'After booking, you\\'ll receive driver details including name, contact, and languages (English, Japanese, Tagalog).';
  } else if (lowerMessage.includes('contact')) {
    return 'Contact us at unclesamtourservices1988@gmail.com or +81 80-5331-1738 for reservations and inquiries.';
  } else {
    return 'I can help with questions about bookings, payments, cancellations, pricing, drivers, and contact information. What would you like to know?';
  }
}
</script>
`;

// Weather API Integration Embed Code
export const WeatherAPIEmbed = `
<script>
// Weather API Integration for UncleSam Tours
class WeatherService {
  constructor() {
    this.apiKey = 'demo-key'; // Replace with actual API key
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.cache = new Map();
  }
  
  async getWeather(destination) {
    // Check cache first
    const cacheKey = destination.toLowerCase();
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return cached.data;
      }
    }
    
    try {
      // Mock weather data for demo
      const mockWeather = {
        'nagoya': { temp: 24, condition: 'Sunny', warning: null },
        'tokyo': { temp: 22, condition: 'Partly Cloudy', warning: null },
        'kyoto': { temp: 26, condition: 'Clear', warning: null },
        'hiroshima': { temp: 25, condition: 'Sunny', warning: null },
        'osaka': { temp: 18, condition: 'Rain', warning: 'Heavy rain expected' },
        'fukuoka': { temp: 23, condition: 'Overcast', warning: null }
      };
      
      const weather = mockWeather[cacheKey] || { temp: 20, condition: 'Unknown', warning: null };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: weather,
        timestamp: Date.now()
      });
      
      return weather;
    } catch (error) {
      console.error('Weather API error:', error);
      return { temp: 20, condition: 'Unknown', warning: 'Weather data unavailable' };
    }
  }
  
  async checkMultipleDestinations(destinations) {
    const results = await Promise.all(
      destinations.map(dest => this.getWeather(dest))
    );
    
    return destinations.map((dest, index) => ({
      destination: dest,
      weather: results[index]
    }));
  }
}

// Initialize weather service
window.uncleSamWeather = new WeatherService();

// Itinerary Generation
class ItineraryGenerator {
  constructor(weatherService) {
    this.weather = weatherService;
  }
  
  async generateItinerary(destinations, date, travelers) {
    // Get weather for all destinations
    const weatherData = await this.weather.checkMultipleDestinations(destinations);
    
    // Check for weather warnings
    const warnings = weatherData
      .filter(item => item.weather.warning)
      .map(item => \`\${item.destination}: \${item.weather.warning}\`);
    
    // Generate basic itinerary structure
    const itinerary = {
      date: date,
      travelers: travelers,
      destinations: destinations,
      weather: weatherData,
      warnings: warnings,
      schedule: this.createSchedule(destinations),
      alternatives: warnings.length > 0 ? this.suggestAlternatives(destinations) : []
    };
    
    return itinerary;
  }
  
  createSchedule(destinations) {
    const schedule = [
      { time: '09:00', activity: 'Hotel Pick-up & Welcome Briefing', location: 'Your Hotel', duration: '30 mins' }
    ];
    
    let currentTime = 9.5; // 9:30 AM
    
    destinations.forEach((dest, index) => {
      // Travel time
      schedule.push({
        time: this.formatTime(currentTime),
        activity: \`Travel to \${dest}\`,
        location: dest,
        duration: '45 mins'
      });
      currentTime += 0.75;
      
      // Destination visit
      schedule.push({
        time: this.formatTime(currentTime),
        activity: \`Explore \${dest}\`,
        location: dest,
        duration: '2 hours'
      });
      currentTime += 2;
      
      // Lunch break (if midday)
      if (currentTime >= 12 && currentTime <= 14 && index === Math.floor(destinations.length / 2)) {
        schedule.push({
          time: this.formatTime(currentTime),
          activity: 'Traditional Japanese Lunch',
          location: 'Local Restaurant',
          duration: '1 hour'
        });
        currentTime += 1;
      }
    });
    
    // Return journey
    schedule.push({
      time: this.formatTime(currentTime),
      activity: 'Return to Hotel',
      location: 'Your Hotel',
      duration: '45 mins'
    });
    
    return schedule;
  }
  
  formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`;
  }
  
  suggestAlternatives(originalDestinations) {
    const alternatives = [
      'Atsuta Shrine', 'Toyota Museum', 'Nagoya TV Tower',
      'Shirotori Garden', 'Tokugawa Art Museum', 'Port Building'
    ];
    
    return alternatives
      .filter(alt => !originalDestinations.includes(alt))
      .slice(0, 3);
  }
  
  exportToPDF(itinerary) {
    // Generate PDF content
    const pdfContent = \`
UncleSam Tours - Personal Itinerary
Generated for \${itinerary.travelers} passenger(s)
Travel Date: \${itinerary.date}

DESTINATIONS:
\${itinerary.destinations.map((dest, i) => \`\${i + 1}. \${dest}\`).join('\\n')}

WEATHER FORECAST:
\${itinerary.weather.map(w => \`\${w.destination}: \${w.weather.condition}, \${w.weather.temp}°C\`).join('\\n')}

DETAILED SCHEDULE:
\${itinerary.schedule.map(item => 
  \`\${item.time} - \${item.activity} at \${item.location} (\${item.duration})\`
).join('\\n')}

INCLUSIONS:
• 12-hour private tour with dedicated tour assistant
• Private van transportation with multilingual driver
• Gas and toll fees included
• Hotel pick-up and drop-off service
• Driver fluent in English, Japanese, and Tagalog

Contact: unclesamtourservices1988@gmail.com | +81 80-5331-1738
    \`;
    
    // Create and download file
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`UncleSam-Tours-Itinerary-\${itinerary.date}.txt\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Initialize itinerary generator
window.uncleSamItinerary = new ItineraryGenerator(window.uncleSamWeather);

console.log('UncleSam Tours AI Services initialized successfully');
</script>
`;

// Combined Builder.io Integration Code
export const BuilderIntegrationCode = `
<!-- UncleSam Tours AI Integration -->
<!-- Add this to Builder.io Custom Code section -->

${FAQChatbotEmbed}

${WeatherAPIEmbed}

<style>
/* UncleSam Tours Brand Colors */
:root {
  --unclesam-red: #dc2626;
  --unclesam-red-dark: #b91c1c;
  --unclesam-white: #ffffff;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  #unclesam-faq-chatbot .chatbot-window {
    width: 320px;
    height: 400px;
    bottom: 70px;
    right: -16px;
  }
}
</style>

<script>
// API Status Monitoring
function checkAPIStatus() {
  const services = ['chatbot', 'weather', 'itinerary'];
  const status = {};
  
  services.forEach(service => {
    try {
      switch(service) {
        case 'chatbot':
          status.chatbot = document.getElementById('unclesam-faq-chatbot') ? 'online' : 'offline';
          break;
        case 'weather':
          status.weather = window.uncleSamWeather ? 'online' : 'offline';
          break;
        case 'itinerary':
          status.itinerary = window.uncleSamItinerary ? 'online' : 'offline';
          break;
      }
    } catch (error) {
      status[service] = 'error';
    }
  });
  
  // Log status for dashboard monitoring
  console.log('UncleSam Tours AI Status:', status);
  
  // Send to analytics (if needed)
  if (window.gtag) {
    window.gtag('event', 'ai_status_check', {
      'chatbot_status': status.chatbot,
      'weather_status': status.weather,
      'itinerary_status': status.itinerary
    });
  }
  
  return status;
}

// Run status check every 5 minutes
setInterval(checkAPIStatus, 300000);

// Initial status check
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkAPIStatus, 2000);
});
</script>
`;
