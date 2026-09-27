import Image from "next/image";

export function AuthIntroduction() {
  return (
    <aside className="auth-introduction">
      <div className="auth-introduction-copy">
        <p className="product-eyebrow">A LITTLE MORE LOCAL</p>
        <h2>A new place.<br />Your kind of <em>people.</em></h2>
        <p>Good company. Local discoveries. More reasons to get together.</p>
      </div>
      <div className="auth-community-photo">
        <Image src="/community-friends.jpg" alt="Friends enjoying time together outdoors" fill sizes="(max-width: 850px) 1px, (max-width: 1200px) 45vw, 520px" />
      </div>
      <p className="auth-caption">One account for Tivorah on web and mobile.</p>
    </aside>
  );
}
