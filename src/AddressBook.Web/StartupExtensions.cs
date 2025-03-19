using Scalar.AspNetCore;

namespace AddressBook.Web;

public static class StartupExtensions
{
  public static WebApplication ConfigureOpenApi(this WebApplication app)
  {
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapScalarApiReference(o => o.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json");

    return app;
  }
}