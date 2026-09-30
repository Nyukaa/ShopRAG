import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message, sessionId } = await request.json();

    // Отправляем запрос в ваш существующий FastAPI микросервис
    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId || "default-session", // Используем переданный ID или дефолтный
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData },
        { status: response.status },
      );
    }

    const data = await response.json(); // Получаем { reply: "..." }
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Ошибка в Next.js API:", error);
    return NextResponse.json(
      { error: "Не удалось связаться с ИИ-сервисом" },
      { status: 500 },
    );
  }
}
