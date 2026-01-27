import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatButton() {
  // For now, just display the button. Chat functionality will be implemented in Phase 5
  const unreadCount = 128;

  return (
    <Button
      className="fixed bottom-6 right-6 rounded-full px-6 py-3 shadow-lg bg-primary hover:bg-primary/90"
      size="lg"
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      CHAT ({unreadCount})
    </Button>
  );
}
