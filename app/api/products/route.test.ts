/**
 * @jest-environment node
 */
import { GET, POST } from "./route";
import { supabase } from "@/lib/supabase";
import { getAuthUser, requireRole } from "@/lib/auth";
import { validateProduct } from "@/lib/validate-product";

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

jest.mock("@/lib/auth", () => ({
  getAuthUser: jest.fn(),
  requireRole: jest.fn(),
}));

jest.mock("@/lib/validate-product", () => ({
  validateProduct: jest.fn(),
}));

/**
 * Строит "thenable" мок supabase query-builder'а.
 * Каждый метод возвращает сам билдер (чейнинг), а await на любом
 * шаге резолвится через .then(), как это устроено в supabase-js.
 */
function createSupabaseMock(finalResult: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(() => builder),
    then: (resolve: (v: typeof finalResult) => void) =>
      Promise.resolve(finalResult).then(resolve),
  };
  return builder;
}

function mockRequest(body: unknown, { invalidJson = false } = {}) {
  return {
    json: invalidJson
      ? jest.fn().mockRejectedValue(new Error("bad json"))
      : jest.fn().mockResolvedValue(body),
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/products", () => {
  it("возвращает список продуктов со статусом 200", async () => {
    const products = [
      { id: "1", name: "Foo", category: { id: "c1", name: "Cat" } },
      { id: "2", name: "Bar", category: { id: "c2", name: "Cat" } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: products, error: null })
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(products);
    expect(supabase.from).toHaveBeenCalledWith("products");
  });

  it("возвращает 500 при ошибке базы данных", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: null, error: { message: "db down" } })
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "db down" });
  });
});

describe("POST /api/products", () => {
  const validBody = { name: "New product", sku: "SKU-1", price: 100 };

  it("возвращает 403 (или Response от requireRole), если роль не подходит", async () => {
    const denyResponse = Response.json({ error: "Forbidden" }, { status: 403 });
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "customer" });
    (requireRole as jest.Mock).mockReturnValue(denyResponse);

    const res = await POST(mockRequest(validBody));

    expect(res).toBe(denyResponse);
    expect(res.status).toBe(403);
    // до проверки роли supabase не должен вызываться
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("возвращает 400 при невалидном JSON в теле запроса", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);

    const res = await POST(mockRequest(undefined, { invalidJson: true }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "Invalid JSON" });
  });

  it("возвращает 400, если валидация не пройдена", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "manager" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: false,
      error: "name is required",
    });

    const res = await POST(mockRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "name is required" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("создаёт продукт и возвращает 201", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: true,
      data: validBody,
    });
    const created = { id: "1", ...validBody };
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: created, error: null })
    );

    const res = await POST(mockRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual(created);
  });

  it("возвращает 409, если SKU уже существует (23505)", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: true,
      data: validBody,
    });
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({
        data: null,
        error: { code: "23505", message: "duplicate key" },
      })
    );

    const res = await POST(mockRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({ error: "SKU already exists" });
  });

  it("возвращает 500 при прочих ошибках базы данных", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: true,
      data: validBody,
    });
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({
        data: null,
        error: { code: "OTHER", message: "unexpected failure" },
      })
    );

    const res = await POST(mockRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "unexpected failure" });
  });
});
