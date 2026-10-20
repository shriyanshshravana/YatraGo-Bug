export default function ItineraryDay({ day, title, items = [] }) {
  return <section className="itinerary-day"><span className="eyebrow">Day {day}</span><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
