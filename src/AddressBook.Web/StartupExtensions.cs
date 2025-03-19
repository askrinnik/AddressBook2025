using Scalar.AspNetCore;

namespace AddressBook.Web;

/// <summary>
/// Extension methods for configuring application startup
/// </summary>
public static class StartupExtensions
{
  /// <summary>
  /// Configure OpenApi specification and UI
  /// </summary>
  /// <param name="app"></param>
  /// <returns></returns>
  public static WebApplication ConfigureOpenApi(this WebApplication app)
  {
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapScalarApiReference(o => o.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json");

    return app;
  }
}