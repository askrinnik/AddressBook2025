using AddressBook.Web.Components;
using Microsoft.AspNetCore.Components;
using Scalar.AspNetCore;

namespace AddressBook.Web;

/// <summary>
/// Extension methods for configuring application startup
/// </summary>
public static class StartupExtensions
{
  /// <summary>
  /// Configure Blazor dependencies
  /// </summary>
  public static WebApplicationBuilder ConfigureBlazor(this WebApplicationBuilder builder)
  {
    //builder.Services.AddCors(options => options.AddPolicy("AllowBlazor",
    //  policy => policy.WithOrigins("https://localhost:7166")
    //    .AllowAnyMethod()
    //    .AllowAnyHeader()));

    builder.Services.AddRazorComponents()
      .AddInteractiveWebAssemblyComponents();

    builder.Services.AddScoped(sp =>
    {
      var navigationManager = sp.GetRequiredService<NavigationManager>();
      return new HttpClient { BaseAddress = new Uri(navigationManager.BaseUri) }; // for server rendering
    });

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
  public static WebApplication ConfigureBlazor(this WebApplication app)
  {
    //app.UseCors("AllowBlazor");
    if (app.Environment.IsDevelopment())
    {
      app.UseWebAssemblyDebugging();
    }
    else
    {
      app.UseExceptionHandler("/Error", createScopeForErrors: true);
    }
    app.UseAntiforgery();

    app.MapStaticAssets();
    app.MapRazorComponents<App>()
      .AddInteractiveWebAssemblyRenderMode()
      .AddAdditionalAssemblies(typeof(AddressBook.Web.Client._Imports).Assembly);

    return app;
  }

}