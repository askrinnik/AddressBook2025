using AddressBook.Web;
using AddressBook.Web.DataAccess;
using System.Reflection;
using AddressBook.Web.Components;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSwaggerGen(c =>
{
  var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
  var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
  c.IncludeXmlComments(xmlPath);
});

builder.Services.AddMediatR(cfg => 
  cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

builder.ConfigureDataAccess();

builder.Services.AddCors(options => options.AddPolicy("AllowBlazor",
  policy => policy.WithOrigins("https://localhost:7166")
    .AllowAnyMethod()
    .AllowAnyHeader()));

builder.Services.AddRazorComponents()
  .AddInteractiveWebAssemblyComponents();

var app = builder.Build();

app.ExecuteDatabaseMigration();
app.ConfigureOpenApi();
//app.UseHttpsRedirection();
//app.UseAuthorization();
app.MapControllers();

app.UseCors("AllowBlazor");

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

app.Run();
