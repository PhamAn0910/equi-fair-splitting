const MarqueeSection = () => {
  const items = [
    { text: "Dinner Dates", emoji: "🍕", bgClass: "bg-secondary text-secondary-foreground" },
    { text: "Roommates", emoji: "🏠", bgClass: "bg-accent text-accent-foreground" },
    { text: "Road Trips", emoji: "🚗", bgClass: "bg-primary text-primary-foreground" },
    { text: "Parties", emoji: "🎉", bgClass: "bg-teal text-teal-foreground" },
  ];

  const MarqueeContent = () => (
    <div className="inline-flex items-center gap-6">
      {items.map((item, index) => (
        <div key={index} className="inline-flex items-center gap-6">
          <span
            className={`${item.bgClass} px-10 py-5 rounded-full text-2xl md:text-4xl font-display italic font-bold`}
          >
            {item.text}
          </span>
          <span className="text-4xl">{item.emoji}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 bg-card overflow-hidden relative border-y border-border">
      <div className="flex gap-6 animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
        <MarqueeContent />
        <MarqueeContent />
      </div>
    </section>
  );
};

export default MarqueeSection;
