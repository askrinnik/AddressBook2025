using AddressBook.Api;

using var loggerFactory = LoggerFactory.Create(cfg => cfg.ConfigureLogger());
var mainLogger = loggerFactory.CreateLogger<Program>();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureBuilder(mainLogger);

mainLogger.LogInformation("Building an application...");
var app = builder.Build();

var isSwaggerGeneration = IsSwaggerGeneration();
app.ConfigureApp(isSwaggerGeneration, mainLogger);

mainLogger.LogInformation("Starting the application...");
app.Run();
return;

bool IsSwaggerGeneration()
{
  // The "dotnet swagger tofile" command always passes arguments like:
  //   swagger tofile --output v1
  // so we can check the process name or arguments
  return args.Contains("swagger", StringComparer.OrdinalIgnoreCase) ||
         AppDomain.CurrentDomain.FriendlyName.Contains("swagger", StringComparison.OrdinalIgnoreCase);
}

