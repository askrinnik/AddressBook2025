using Microsoft.EntityFrameworkCore;
using AddressBook.Web.Domain;

namespace AddressBook.Web.DataAccess
{
  public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
  {
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<Phone> Phones { get; set; }
    public DbSet<PhoneOperator> PhoneOperators { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);
    }
  }
}
