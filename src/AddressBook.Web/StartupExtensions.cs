using AddressBook.Web.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace AddressBook.Web;

public static class StartupExtensions
{
  /// <summary>
  /// Configure Entity Framework Core with SQL Server
  /// </summary>
  public static WebApplicationBuilder ConfigureDatabase(this WebApplicationBuilder builder)
  {
    var server = builder.Configuration["Database:Server"];
    var user = builder.Configuration["Database:User"];
    var password = builder.Configuration["Database:Password"];

    var connectionString =
      $"Server={server};Database=AddressBook;User={user};Password={password};TrustServerCertificate=True;MultipleActiveResultSets=true;Max Pool Size=2500";
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
      options.UseSqlServer(connectionString));
    
    return builder;
  }

  /// <summary>
  /// Ensure database is created and migrations are applied
  /// </summary>
  public static WebApplication ExecuteDatabaseMigration(this WebApplication app)
  {
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();

    return app;
  }
}