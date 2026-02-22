import type { HeroProps } from './types';

export default function Hero({ title, description }: HeroProps) {
  return (
    <div className='py-1 text-center flex flex-col items-center justify-center gap-1'>
      <h1 className='text-xl font-bold text-center text-heading md:text-2xl'>
        {title}
      </h1>
      <p className='mx-auto max-w-prose md:max-w-3xl text-center text-muted-foreground text-xs md:text-sm'>
        {description}
      </p>
    </div>
  );
}
