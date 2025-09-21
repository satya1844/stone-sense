'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X, Bot, User, Minus } from 'lucide-react';

export default function HealthChatbot({ detectionResults }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your kidney stone health advisor. I can help answer questions about your scan results and provide personalized health advice. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcut to toggle chatbot (Ctrl+H)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        handleChatbotToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMinimized]);

  // Function to format AI response with better structure using regex
  const formatBotResponse = (text) => {
    if (!text) return text;
    
    let formatted = text;
    
    // Clean up extra whitespace and normalize line breaks
    formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    formatted = formatted.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
    formatted = formatted.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
    formatted = formatted.trim();
    
    // Format headers (text followed by colon at start of line)
    formatted = formatted.replace(/^([A-Z][^:\n]*):[ \t]*$/gm, '**$1:**');
    formatted = formatted.replace(/\n([A-Z][A-Za-z\s]{2,}):[ \t]*\n/g, '\n**$1:**\n');
    
    // Format numbered lists
    formatted = formatted.replace(/^(\d+)\.\s+/gm, '• ');
    
    // Normalize bullet points to consistent format
    formatted = formatted.replace(/^[\s]*[-*•]\s+/gm, '• ');
    formatted = formatted.replace(/^[\s]*[▪▫◦‣⁃]\s+/gm, '• ');
    
    // Format emphasis and strong text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '**$1**');
    formatted = formatted.replace(/__(.*?)__/g, '**$1**');
    formatted = formatted.replace(/\*(.*?)\*/g, '*$1*');
    
    // Format medical terms and measurements
    formatted = formatted.replace(/(\d+\.?\d*)\s*(mm|cm|mg|ml|liters?)\b/gi, '**$1$2**');
    formatted = formatted.replace(/(\d+)-(\d+)\s*(mm|cm|mg|ml|liters?)\b/gi, '**$1-$2$3**');
    
    // Format dosage and timing
    formatted = formatted.replace(/(\d+)\s*(times?\s+(?:per\s+)?(?:day|daily|week|hour))/gi, '**$1 $2**');
    
    // Format important keywords
    const importantKeywords = [
      'urgent', 'immediate', 'emergency', 'severe', 'serious', 'critical',
      'consult', 'doctor', 'physician', 'urologist', 'specialist',
      'avoid', 'reduce', 'increase', 'drink', 'hydrate'
    ];
    
    importantKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      formatted = formatted.replace(regex, '**$1**');
    });
    
    // Format percentage values
    formatted = formatted.replace(/(\d+\.?\d*)%/g, '**$1%**');
    
    // Clean up any double formatting
    formatted = formatted.replace(/\*\*\*\*(.*?)\*\*\*\*/g, '**$1**');
    
    return formatted;
  };

  // Function to render formatted message content with regex-enhanced formatting
  const renderMessageContent = (message) => {
    if (message.sender === 'user') {
      return (
        <p className="text-sm leading-relaxed">
          {message.text}
        </p>
      );
    }

    // For bot messages, apply advanced formatting
    const formattedText = formatBotResponse(message.text);
    
    // Split into sections based on double line breaks
    const sections = formattedText.split('\n\n').filter(section => section.trim());

    return (
      <div className="text-sm leading-relaxed space-y-3">
        {sections.map((section, index) => {
          const lines = section.split('\n').filter(line => line.trim());
          
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lineIndex) => {
                const trimmedLine = line.trim();
                
                // Check for headers (bold text with colons)
                if (/^\*\*(.*?):\*\*/.test(trimmedLine)) {
                  const headerText = trimmedLine.replace(/^\*\*(.*?):\*\*/, '$1:');
                  return (
                    <h4 key={lineIndex} className="font-bold text-blue-800 mb-1 text-sm">
                      {headerText}
                    </h4>
                  );
                }
                
                // Check for bullet points
                if (trimmedLine.startsWith('• ')) {
                  const bulletText = trimmedLine.substring(2);
                  return (
                    <div key={lineIndex} className="flex items-start ml-2">
                      <span className="text-blue-500 mr-2 mt-1 text-xs">●</span>
                      <span className="flex-1">{renderFormattedText(bulletText)}</span>
                    </div>
                  );
                }
                
                // Regular paragraphs
                if (trimmedLine) {
                  return (
                    <p key={lineIndex} className="text-gray-700">
                      {renderFormattedText(trimmedLine)}
                    </p>
                  );
                }
                
                return null;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Function to render text with inline formatting (bold, italic, etc.)
  const renderFormattedText = (text) => {
    const parts = [];
    let lastIndex = 0;
    
    // Process bold text (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the bold text
      parts.push(
        <strong key={match.index} className="font-semibold text-blue-700">
          {match[1]}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // If no formatting was found, return the original text
    if (parts.length === 0) {
      return text;
    }
    
    return <>{parts}</>;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare stones data for the chatbot
      const stonesData = detectionResults?.detections?.map(detection => ({
        id: detection.id,
        diameter_mm: `${detection.diameter_mm} mm`,
        position: detection.position,
        confidence: `${(detection.confidence * 100).toFixed(1)}%`,
        type: detection.type || 'kidney_stone'
      })) || [];

      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          stones_data: stonesData
        }),
      });

      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        text: data.response || 'I apologize, but I encountered an issue processing your question.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: 'I apologize, but I\'m having trouble connecting to the chat service. Please try again in a moment.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What should I do about these stones?",
    "How serious is my condition?", 
    "What dietary changes should I make?",
    "When should I see a doctor?",
    "How can I prevent more stones?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Handle opening/minimizing the chatbot
  const handleChatbotToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  if (!isOpen || isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleChatbotToggle}
          className={`h-14 w-14 rounded-full shadow-lg transition-all duration-200 ${
            isMinimized 
              ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          size="icon"
          title={isMinimized ? "Restore Chat (Ctrl+H)" : "Open Health Advisor (Ctrl+H)"}
        >
          <MessageCircle className="h-6 w-6" />
          {isMinimized && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[500px] flex flex-col shadow-xl transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">Health Advisor</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-blue-700"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-blue-700"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.sender === 'bot' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                  )}
                  {message.sender === 'user' && (
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-80" />
                  )}
                  <div className="flex-1">
                    {renderMessageContent(message)}
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-full transition-colors"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your scan results..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {detectionResults?.summary?.total_stones > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Chat is based on your scan with {detectionResults.summary.total_stones} detected stone(s)
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}