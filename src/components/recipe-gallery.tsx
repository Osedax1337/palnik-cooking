import Image from 'next/image'

export function RecipeGallery({
  images,
  alt,
  large = false,
}: {
  images: string[]
  alt: string
  large?: boolean
}) {
  const visible = images.slice(0, 4)

  if (visible.length <= 1) {
    return (
      <Image
        src={visible[0] ?? images[0]}
        alt={alt}
        fill
        className="object-cover transition duration-700 ease-out animate-fade-up-soft group-hover:scale-[1.06]"
        sizes={large ? '(max-width: 1024px) 100vw, 45vw' : '(max-width: 1024px) 100vw, 33vw'}
        priority={large}
        quality={large ? 88 : 78}
      />
    )
  }

  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 bg-[#201714] p-1">
      {visible.map((src, index) => (
        <div key={`${src}-${index}`} className="relative overflow-hidden rounded-[0.9rem] first:col-span-2 first:row-span-1">
          <Image
            src={src}
            alt={`${alt} — ujęcie ${index + 1}`}
            fill
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
            sizes={large ? '(max-width: 1024px) 50vw, 24vw' : '(max-width: 1024px) 50vw, 16vw'}
            priority={large && index === 0}
            quality={large && index === 0 ? 86 : 74}
          />
        </div>
      ))}
    </div>
  )
}
