"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-body">
      <section className="panel empty-state">
        <h1>学习空间暂时走丢了</h1>
        <p>试着重新打开，已经保存的学习记录还在。</p>
        <button className="primary" onClick={reset}>
          再试一次
        </button>
      </section>
    </main>
  );
}
