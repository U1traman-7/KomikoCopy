import React from 'react';
type Media = {
  title?: string;
  caption: string;
  source: string;
  type: 'image' | 'video';
};

type Links = {
  title: string;
  url: string;
};

interface WhatIsProps {
  title: string;
  description: string;
  media?: Media[];
  links?: Links[];
}

export default function WhatIs({
  title,
  description,
  media,
  links,
}: WhatIsProps) {
  return (
    <section>
      <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      <p className='mx-auto max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
        {description}
      </p>
      {media &&
        media.map((mediaItem, index) => (
          <div key={`${mediaItem.title || 'media'}-${index}`} className='mt-6'>
            {mediaItem.title && (
              <h4 className='mb-4 text-lg font-bold text-primary-600 md:text-xl text-center'>
                {mediaItem.title}
              </h4>
            )}
            <figure className='mx-auto max-w-4xl'>
              {mediaItem.type === 'image' ? (
                <img
                  src={mediaItem.source}
                  alt={mediaItem.title || mediaItem.caption}
                  className='w-full h-auto rounded-lg shadow-sm'
                  loading='lazy'
                />
              ) : (
                <video
                  src={`${mediaItem.source}#t=0.001`}
                  className='w-full h-auto rounded-lg shadow-sm'
                  controls
                  muted
                  playsInline
                  preload='metadata'>
                  Your browser does not support the video tag.
                </video>
              )}
              <figcaption className='mt-2 text-left text-muted-foreground text-xs md:text-sm'>
                {mediaItem.caption}
              </figcaption>
            </figure>
          </div>
        ))}
      {links &&
        links.map((link, index) => (
          <div key={`${link.title || 'link'}-${index}`} className='mt-6'>
            <a href={link.url} target='_blank' rel='noopener noreferrer'>
              {link.title}
            </a>
          </div>
        ))}
    </section>
  );
}