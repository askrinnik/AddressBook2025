using Scalar.AspNetCore;
using Microsoft.EntityFrameworkCore;
using AddressBook.Web.DataAccess;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

// Configure Entity Framework Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

var app = builder.Build();

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
  var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
  dbContext.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();
app.MapScalarApiReference(o => o.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json");

//app.UseHttpsRedirection();
//app.UseAuthorization();

app.MapControllers();

app.Run();
