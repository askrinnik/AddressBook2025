using System.Reflection;
using AddressBook.Api;
using AddressBook.Api.DataAccess;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
// don't forget to add
// app.UseExceptionHandler(_ => { });

builder.Services.AddControllers();

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly, includeInternalTypes: true);

builder.Services.AddSwaggerGen(c =>
{
  var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
  var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
  c.IncludeXmlComments(xmlPath);
});

builder.Services.AddMediatR(cfg => 
  cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

builder.ConfigureDataAccess();
builder.ConfigureClientAccess();

var app = builder.Build();

if (!IsSwaggerGeneration())
    app.ExecuteDatabaseMigration();

app.ConfigureOpenApi();
//app.UseHttpsRedirection();
//app.UseAuthorization();
app.MapControllers();
app.ConfigureClientAccess();

// It should be added to disable the DeveloperExceptionPageMiddleware and allow to use my GlobalExceptionHandler
app.UseExceptionHandler(_ => { });

app.Run();

// It verifies that the app is run in the context of Swagger generation for Azure API Management
// That was invoked because a publishing file contains <UpdateApiOnPublish>true</UpdateApiOnPublish>
bool IsSwaggerGeneration()
{
    // The "dotnet swagger tofile" command always passes arguments like:
    //   swagger tofile --output v1
    // so we can check the process name or arguments
    return args.Contains("swagger", StringComparer.OrdinalIgnoreCase) ||
           AppDomain.CurrentDomain.FriendlyName.Contains("swagger", StringComparison.OrdinalIgnoreCase);
}
