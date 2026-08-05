using AddressBook.Api.DataAccess;
using FluentValidation;
using Microsoft.Extensions.Logging.Console;
using Scalar.AspNetCore;
using System.Reflection;

namespace AddressBook.Api;

/// <summary>
/// Extension methods for configuring application startup
/// </summary>
public static class StartupExtensions
{
  private const string BlazorCorsPolicy = "AllowBlazor";

  /// <summary>
  /// Configures a logger
  /// </summary>
  /// <param name="builder"></param>
  /// <returns></returns>
  public static ILoggingBuilder ConfigureLogger(this ILoggingBuilder builder) =>
    builder.AddSimpleConsole(conf =>
    {
      conf.ColorBehavior = LoggerColorBehavior.Enabled;
      conf.SingleLine = true;
      conf.TimestampFormat = "HH:mm:ss ";
    });

  /// <summary>
  /// Configure an application builder
  /// </summary>
  /// <param name="webApplicationBuilder"></param>
  /// <param name="mainLogger"></param>
  public static void ConfigureBuilder(this WebApplicationBuilder webApplicationBuilder, ILogger<Program> mainLogger)
  {
    mainLogger.LogInformation("Configuring an application builder...");
    
    webApplicationBuilder.Services.AddProblemDetails();

    webApplicationBuilder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    // don't forget to add
    // app.UseExceptionHandler(_ => { });

    webApplicationBuilder.Services.AddControllers();

    webApplicationBuilder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly, includeInternalTypes: true);

    webApplicationBuilder.Services.AddSwaggerGen(c =>
    {
      var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
      var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
      c.IncludeXmlComments(xmlPath);
    });

    webApplicationBuilder.Services.AddMediatR(cfg =>
      cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

    webApplicationBuilder.ConfigureDataAccess();
    webApplicationBuilder.ConfigureClientAccess();
  }

  /// <summary>
  /// Configure an application
  /// </summary>
  /// <param name="app"></param>
  /// <param name="isSwaggerGeneration"></param>
  /// <param name="logger"></param>
  public static void ConfigureApp(this WebApplication app, bool isSwaggerGeneration, ILogger<Program> logger)
  {
    logger.LogInformation("Configuring the application...");

    if (!isSwaggerGeneration)
    {
      logger.LogInformation("Executing database migration...");
      try
      {
        app.ExecuteDatabaseMigration();
        logger.LogInformation("The database migration has been completed");
      }
      catch (Exception e)
      {
        logger.LogCritical(e, "Error during the database migration");
      }
    }

    // Exception handler must be first so it wraps all downstream middleware
    app.UseExceptionHandler(_ => { });

    // Warn if CORS is open in non-development environments
    if (!app.Environment.IsDevelopment())
    {
      var allowedOrigins = app.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
      if (allowedOrigins.Length == 0)
        logger.LogWarning(
          "SECURITY: AllowedOrigins is not configured — all CORS origins are permitted. " +
          "Set AllowedOrigins in production configuration (e.g., Azure App Service app settings: AllowedOrigins__0=https://your-app.azurestaticapps.net).");
    }

    app.ConfigureOpenApi();

    // CORS must be before controllers so it handles preflight requests
    app.ConfigureClientAccess();

    // HTTPS is terminated at the Azure App Service load balancer; enable if running without a reverse proxy.
    //app.UseHttpsRedirection();

    // Uncomment when authentication is added:
    //app.UseAuthentication();
    //app.UseAuthorization();

    app.MapControllers();
    app.ConfigureClientAccess();
  }

  /// <summary>
  /// Configure CORS for the Blazor WebAssembly client.
  /// In production, set AllowedOrigins in configuration (e.g., Azure App Service application settings:
  ///   AllowedOrigins__0 = https://your-app.azurestaticapps.net)
  /// If AllowedOrigins is empty/missing, all origins are allowed (suitable for local development).
  /// </summary>
  private static void ConfigureClientAccess(this WebApplicationBuilder builder)
  {
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];

    builder.Services.AddCors(options => options.AddPolicy(BlazorCorsPolicy, policy =>
    {
      if (allowedOrigins.Length > 0)
        policy.WithOrigins(allowedOrigins);
      else
        policy.AllowAnyOrigin(); // dev fallback — restrict via AllowedOrigins in production

      policy
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders("Location"); // only Location is needed (for 201 Created responses)
    }));
  }

  /// <summary>
  /// Configure OpenApi specification and UI
  /// </summary>
  /// <param name="app"></param>
  /// <returns></returns>
  private static void ConfigureOpenApi(this WebApplication app)
  {
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapScalarApiReference(o => o.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json");
  }

  /// <summary>
  /// Configure Blazor middleware
  /// </summary>
  private static void ConfigureClientAccess(this WebApplication app)
  {
    app.UseCors(BlazorCorsPolicy);
  }


}