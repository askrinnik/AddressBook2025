using AddressBook.Web;
using AddressBook.Web.DataAccess;
using System.Reflection;

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
builder.ConfigureBlazor();

var app = builder.Build();

app.ExecuteDatabaseMigration();
app.ConfigureOpenApi();
//app.UseHttpsRedirection();
//app.UseAuthorization();
app.MapControllers();
app.ConfigureBlazor();

app.Run();
