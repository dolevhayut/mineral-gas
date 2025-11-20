import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import { processAIQuery } from '@/services/aiQueryService';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIQueryAssistant() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין שאלה',
        variant: 'destructive'
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // Process query with AI
      const response = await processAIQuery(query);
      
      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעיבוד השאלה',
        variant: 'destructive'
      });
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה בעיבוד השאלה. אנא נסה שוב.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    'כמה הזמנות בוצעו החודש?',
    'מה ההכנסות של חודש ינואר?',
    'הצג לי את כל קריאות השירות הפתוחות',
    'כמה הזמנות יש בסטטוס ממתין?',
  ];

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <Card className="w-full shadow-lg border-2 border-bottle-100">
      <CardHeader className="bg-gradient-to-r from-bottle-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-bottle-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              עוזר AI חכם
              <span className="text-sm bg-bottle-600 text-white px-2 py-1 rounded-full">חדש!</span>
            </CardTitle>
            <CardDescription className="text-base">
              שאל אותי כל שאלה על הזמנות, לקוחות וקריאות שירות
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Messages Display */}
        {messages.length > 0 && (
          <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-bottle-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="whitespace-pre-wrap text-right flex-1">
                      {message.content}
                    </div>
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-bottle-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-bottle-600" />
                    <span className="text-gray-600">מעבד את השאלה...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Example Queries */}
        {messages.length === 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3 text-right">
              דוגמאות לשאלות:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  className="text-right justify-start h-auto py-2 px-3 hover:bg-bottle-50 hover:border-bottle-300"
                >
                  <MessageSquare className="h-4 w-4 ml-2 flex-shrink-0" />
                  <span className="text-sm">{example}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Info Alert */}
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <AlertDescription className="text-right text-sm">
            💡 אני יכול לעזור לך לשאול שאלות על הזמנות, לקוחות וקריאות שירות. 
            פשוט כתוב את השאלה שלך בשפה חופשית!
          </AlertDescription>
        </Alert>

        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="לדוגמה: כמה הזמנות לקוח דוד כהן ביצע בחודש ינואר?"
              className="min-h-[100px] text-right resize-none pr-4 text-base"
              disabled={isLoading}
              dir="rtl"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-bottle-600 hover:bg-bottle-700 text-white px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  שלח שאלה
                </>
              )}
            </Button>
            
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMessages([]);
                  setQuery('');
                }}
                disabled={isLoading}
              >
                התחל שיחה חדשה
              </Button>
            )}
          </div>
        </form>

        {/* Capabilities Info */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-500 text-right">
            <strong>יכולות:</strong> שאילתות על הזמנות לפי לקוח/תאריך/סטטוס, 
            קריאות שירות, פרטי לקוחות, חישוב הכנסות ועוד.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

