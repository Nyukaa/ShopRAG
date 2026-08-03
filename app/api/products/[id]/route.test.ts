/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from "./route";
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
  } as unknown as Parameters<typeof PUT>[0];
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/products/[id]", () => {
  it("возвращает продукт со статусом 200", async () => {
    const product = {
      id: "1",
      name: "Foo",
      category: { id: "c1", name: "Cat" },
    };
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: product, error: null })
    );

    const res = await GET({} as never, ctx("1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(product);
  });

  it("возвращает 404, если продукт не найден", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: null, error: { message: "not found" } })
    );

    const res = await GET({} as never, ctx("missing"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Product not found" });
  });
});

describe("PUT /api/products/[id]", () => {
  const validBody = { name: "Updated", sku: "SKU-1", price: 200 };

  it("возвращает 403, если роль не подходит", async () => {
    const denyResponse = Response.json({ error: "Forbidden" }, { status: 403 });
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "customer" });
    (requireRole as jest.Mock).mockReturnValue(denyResponse);

    const res = await PUT(mockRequest(validBody), ctx("1"));

    expect(res).toBe(denyResponse);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("возвращает 400 при невалидном JSON", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);

    const res = await PUT(
      mockRequest(undefined, { invalidJson: true }),
      ctx("1")
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "Invalid JSON" });
  });

  it("возвращает 400, если валидация не пройдена", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "manager" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: false,
      error: "price must be positive",
    });

    const res = await PUT(mockRequest({ price: -5 }), ctx("1"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "price must be positive" });
  });

  it("обновляет продукт и возвращает 200", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "manager" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: true,
      data: validBody,
    });
    const updated = { id: "1", ...validBody };
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: updated, error: null })
    );

    const res = await PUT(mockRequest(validBody), ctx("1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(updated);
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

    const res = await PUT(mockRequest(validBody), ctx("1"));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({ error: "SKU already exists" });
  });

  it("возвращает 404, если продукт для обновления не найден", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (validateProduct as jest.Mock).mockReturnValue({
      ok: true,
      data: validBody,
    });
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: null, error: null })
    );

    const res = await PUT(mockRequest(validBody), ctx("missing"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Product not found" });
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

    const res = await PUT(mockRequest(validBody), ctx("1"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "unexpected failure" });
  });
});

describe("DELETE /api/products/[id]", () => {
  it("возвращает 403, если роль не admin (например manager)", async () => {
    const denyResponse = Response.json({ error: "Forbidden" }, { status: 403 });
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "manager" });
    (requireRole as jest.Mock).mockReturnValue(denyResponse);

    const res = await DELETE(mockRequest(undefined), ctx("1"));

    expect(res).toBe(denyResponse);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("удаляет продукт и возвращает 204 без тела", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: null, error: null })
    );

    const res = await DELETE(mockRequest(undefined), ctx("1"));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("возвращает 500 при ошибке базы данных", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ role: "admin" });
    (requireRole as jest.Mock).mockReturnValue(null);
    (supabase.from as jest.Mock).mockReturnValue(
      createSupabaseMock({ data: null, error: { message: "db error" } })
    );

    const res = await DELETE(mockRequest(undefined), ctx("1"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "db error" });
  });
});
