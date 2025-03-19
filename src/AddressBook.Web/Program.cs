using AddressBook.Web;
using AddressBook.Web.DataAccess;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

builder.Services.AddMediatR(cfg => 
  cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

builder.ConfigureDataAccess();

var app = builder.Build();

app.ExecuteDatabaseMigration();
app.ConfigureOpenApi();
//app.UseHttpsRedirection();
//app.UseAuthorization();
app.MapControllers();

app.Run();
