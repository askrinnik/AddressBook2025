using Scalar.AspNetCore;

namespace AddressBook.Api;

/// <summary>
/// Extension methods for configuring application startup
/// </summary>
public static class StartupExtensions
{
  private const string BlazorCorsPolicy = "AllowBlazor";
  /// <summary>
  /// Configure Blazor dependencies
  /// </summary>
  public static WebApplicationBuilder ConfigureClientAccess(this WebApplicationBuilder builder)
  {
    builder.Services.AddCors(options => options.AddPolicy(BlazorCorsPolicy, policy => policy
        //.WithOrigins("https://localhost:7166")
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders("*")));

    return builder;
  }

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

  /// <summary>
  /// Configure Blazor middleware
  /// </summary>
  public static WebApplication ConfigureClientAccess(this WebApplication app)
  {
    app.UseCors(BlazorCorsPolicy);

    return app;
  }

}