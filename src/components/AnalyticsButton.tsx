
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ButtonProps } from '@/components/ui/button';

interface AnalyticsButtonProps extends ButtonProps {
  eventName?: string;
  eventData?: Record<string, any>;
}

export const AnalyticsButton = ({ 
  eventName = 'button_click', 
  eventData = {}, 
  onClick, 
  children, 
  ...props 
}: AnalyticsButtonProps) => {
  const { trackEvent } = useAnalytics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Track the analytics event
    trackEvent(eventName, {
      button_text: typeof children === 'string' ? children : 'button',
      ...eventData
    });

    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};
</AnalyticsButton>
