from mcp.server.mcpserver import MCPServer

import tools as shop  # the same HTTP wrappers used by the chatbot and the eval

mcp = MCPServer("nordic-shop")

# FastMCP builds each tool's input schema from the function's type hints,
# and uses the docstring as the tool description Claude sees. So there is no
# hand-written TOOLS_SCHEMA here — the signature IS the schema.
#
# NOTE: this server talks to clients over stdio, so never print() to stdout
# inside it. Stray output corrupts the protocol messages. Use stderr or logging.


@mcp.tool()
async def search_products(query: str) -> list[dict]:
    """Search Nordic Shop products by keyword or description.
    Returns matching products with id, name, price, description and stock_quantity."""
    return await shop.search_products(query)


@mcp.tool()
async def get_product(product_id: str) -> dict:
    """Get full details for a single product by its ID."""
    return await shop.get_product(product_id)


@mcp.tool()
async def recommend_products(product_id: str) -> list[dict]:
    """Get products similar to a given product ID, ranked by similarity score."""
    return await shop.recommend_products(product_id)


@mcp.tool()
async def check_availability(product_id: str) -> dict:
    """Check whether a product is in stock right now and how many units are left.
    Use this when the question is specifically about current availability."""
    return await shop.check_availability(product_id)


if __name__ == "__main__":
    mcp.run()  # stdio transport by default