"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2,
  Loader2
} from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface FloatingChatbotProps {
  className?: string
}

export function FloatingChatbot({ className }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // TODO: Replace with actual Azure AI Foundry API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || 'I apologize, but I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const closeChatbot = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Icon */}
      {!isOpen && (
        <Button
          onClick={toggleChatbot}
          size="icon"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl chatbot-float"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "w-80 flex flex-col transition-all duration-300 ease-in-out shadow-2xl chatbot-fade-in overflow-hidden",
          isMinimized ? "h-12" : "h-96"
        )}>
          {/* Header */}
          <CardHeader className={cn(
            "flex flex-row items-center justify-between flex-shrink-0",
            isMinimized ? "h-12 min-h-[48px] px-3 py-0" : "px-3 pt-2 pb-1"
          )}>
            <CardTitle className={cn(
              "flex items-center gap-2 font-medium",
              isMinimized ? "text-xs" : "text-sm"
            )}>
              <Bot className={cn(isMinimized ? "h-3 w-3" : "h-4 w-4")} />
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMinimize}
                className={cn(isMinimized ? "h-6 w-6" : "h-6 w-6")}
              >
                <Minimize2 className={cn(isMinimized ? "h-3 w-3" : "h-3 w-3")} />
                <span className="sr-only">Minimize</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeChatbot}
                className={cn(isMinimized ? "h-6 w-6" : "h-6 w-6")}
              >
                <X className={cn(isMinimized ? "h-3 w-3" : "h-3 w-3")} />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-3 pt-1">
                <div className="h-full overflow-y-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 max-w-[85%]",
                        message.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0",
                        message.sender === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {message.sender === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>
                      <div className={cn(
                        "rounded-lg px-3 py-2 text-sm break-words",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 max-w-[85%] mr-auto">
                      <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs flex-shrink-0">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Typing...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input */}
              <div className="p-3 pt-2">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}