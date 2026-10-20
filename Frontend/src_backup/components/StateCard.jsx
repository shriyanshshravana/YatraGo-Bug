import { ArrowRight } from 'lucide-react';

export default function StateCard({ name, note, icon = '🧭', onClick }) {
  return <button className="state-tile" onClick={onClick}><span className="state-icon" aria-hidden="true">{icon}</span><span><strong>{name}</strong><small>{note}</small></span><ArrowRight size={15} style={{ marginLeft: 'auto' }} /></button>;
}
