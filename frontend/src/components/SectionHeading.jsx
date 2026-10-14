export default function SectionHeading({eyebrow,title,accent,description,action}) {
 return <div className="section-heading"><div><small className="eyebrow">{eyebrow}</small><h1>{title} <em>{accent}</em></h1>{description&&<p>{description}</p>}</div>{action&&<div>{action}</div>}</div>;
}
