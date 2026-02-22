import React from 'react';
import { useTranslation } from 'react-i18next';

export const TestimonialsSection = () => {
  const { t } = useTranslation('landing');

  return (
    <div
      className={
        'container px-6 md:px-8 pb-12 mx-auto max-w-[80rem] py-4 md:py-8'
      }>
      <div className='container mx-auto max-w-[100rem] item-center pt-14 md:pt-20'>
        <h2 className='text-foreground text-center font-sans mb-5 text-2xl font-bold leading-tight sm:text-3xl sm:leading-tight md:text-4xl md:leading-tight'>
          {t('testimonials.title')}
        </h2>
        <p className='text-muted-foreground text-center font-strong mb-6 md:mb-12 text-sm !leading-relaxed md:text-lg lg:text-xl text-stroke-1'>
          {t('testimonials.subtitle')}
        </p>
      </div>

      <iframe
        height='800px'
        id='testimonialto-komiko-tag-all-light-animated'
        src='https://embed-v2.testimonial.to/w/komiko?animated=on&theme=light&shadowColor=ffffff&speed=1&tag=all&cc=off'
        frameBorder='0'
        scrolling='no'
        width='100%'
        title='User Testimonials'></iframe>
      {/* <Marquee
        pauseOnHover={true}
        className="py-6 [--duration:30s] [--gap:1rem]"
      >
        {[
          {
            name: t('testimonials.testimonial1.name'),
            title: t('testimonials.testimonial1.title'),
            content: t('testimonials.testimonial1.content'),
            image: "/images/people/women.webp"
          },
          {
            name: t('testimonials.testimonial2.name'),
            title: t('testimonials.testimonial2.title'),
            content: t('testimonials.testimonial2.content'),
            image: "/images/people/Salmonism.webp"
          },
          {
            name: t('testimonials.testimonial3.name'),
            title: t('testimonials.testimonial3.title'),
            content: t('testimonials.testimonial3.content'),
            image: "/images/people/Jenny.jpg"
          },
          {
            name: t('testimonials.testimonial4.name'),
            title: t('testimonials.testimonial4.title'),
            content: t('testimonials.testimonial4.content'),
            image: "/images/people/venti.webp"
          },
          {
            name: t('testimonials.testimonial5.name'),
            title: t('testimonials.testimonial5.title'),
            content: t('testimonials.testimonial5.content'),
            image: "/images/people/man2.webp"
          }
        ].map((testimonial, index) => (
          <div key={index} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px] px-2">
            <div
              className={`flex flex-col justify-center p-5 md:p-7 rounded-2xl bg-card border border-border backdrop-blur-sm mx-2 my-2 min-h-[200px] md:min-h-[220px] w-full cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10`}
            >
              <div className="flex gap-4 md:gap-5 items-center">
                <div className="relative overflow-hidden w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-transparent">
                  <Image
                    src={testimonial.image}
                    width={56}
                    height={56}
                    alt={testimonial.name}
                    className={`object-cover w-full h-full ${testimonial.image.includes('Jenny') ? 'object-top' :
                      testimonial.image.includes('venti') ? 'object-center' :
                        testimonial.image.includes('Salmonism') ? 'object-center' :
                          testimonial.image.includes('women') ? 'object-center' :
                            testimonial.image.includes('man2') ? 'object-center' :
                              'object-center'
                      }`} />
                </div>
                <div>
                  <div className={`text-sm md:text-base font-bold text-foreground`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-xs md:text-sm font-medium ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}`}>
                    {testimonial.title}
                  </div>
                </div>
              </div>
              <p className={`mt-4 md:mt-5 text-sm md:text-base leading-relaxed text-muted-foreground`}>
                "{testimonial.content}"
              </p>
            </div>
          </div>
        ))}
      </Marquee> */}
    </div>
  );
};
