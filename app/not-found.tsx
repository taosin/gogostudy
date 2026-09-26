import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-body">
      <section className="panel empty-state">
        <h1>这里还没有课程</h1>
        <p>回到学习首页，继续今天的小探险。</p>
        <Link href="/" className="primary">
          回到首页
        </Link>
      </section>
    </main>
  );
}
