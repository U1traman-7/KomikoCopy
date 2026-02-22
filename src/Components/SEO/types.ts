export interface VideoExample {
  id: number;
  layout: 'comparison' | 'single';
  type: 'video';
  input: string;
  output?: string;
  inputLabel?: string;
  outputLabel?: string;
  label?: string;
  description: string;
  isSpecial?: boolean;
}



export interface HeroProps {
  title: string;
  description: string;
}

export interface HowToUseProps {
  title: string;
  steps: Array<{
    title: string;
    content: string;
  }>;
}

export interface WhatIsProps {
  title: string;
  description: string;
}

export interface BenefitsProps {
  title: string;
  description: string;
  features: Array<{
    title: string;
    content: string;
    icon: string;
  }>;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface FAQProps {
  title: string;
  description: string;
  faqs: FAQItem[];
}

export interface CTAProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick?: () => void;
}

export interface SingleVideoExamples {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
}

export interface VariantPageProps {
  variantContent: {
    seo: {
      meta: {
        title: string;
        description: string;
        keywords: string;
      };
      hero: {
        title: string;
      };
      whatIs: {
        title: string;
        description: string;
      };
      examples?: {
        title: string;
        description: string;
        layout?: string;
      };
      howToUse: {
        title: string;
        steps: Array<{
          title: string;
          content: string;
        }>;
      };
      benefits: {
        title: string;
        description: string;
        features: Array<{
          title: string;
          content: string;
          icon: string;
        }>;
      };
      faq: {
        title: string;
        description: string;
        q1: string;
        a1: string;
        q2: string;
        a2: string;
        q3: string;
        a3: string;
        q4: string;
        a4: string;
        q5: string;
        a5: string;
        q6: string;
        a6: string;
      };
    };
    examples?: VideoExample[] | SingleVideoExamples[];
    originalKeyword?: string;
    config?: any;
    model?: string;
  };
  variantKey: string;
}
