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

    app.ConfigureOpenApi();
    //app.UseHttpsRedirection();
    //app.UseAuthorization();
    app.MapControllers();
    app.ConfigureClientAccess();

    // It should be added to disable the DeveloperExceptionPageMiddleware and allow to use my GlobalExceptionHandler
    app.UseExceptionHandler(_ => { });
  }

  /// <summary>
  /// Configure Blazor dependencies
  /// </summary>
  private static void ConfigureClientAccess(this WebApplicationBuilder builder)
  {
    builder.Services.AddCors(options => options.AddPolicy(BlazorCorsPolicy, policy => policy
        //.WithOrigins("https://localhost:7166")
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders("*")));
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