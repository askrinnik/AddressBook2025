using AddressBook.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AddressBook.Api.DataAccess;

internal class PhoneOperatorConfiguration : IEntityTypeConfiguration<PhoneOperator>
{
  public void Configure(EntityTypeBuilder<PhoneOperator> builder)
  {
    builder.HasKey(e => e.Id);
    builder.Property(e => e.Id)
      .UseIdentityColumn()
      .HasConversion(
        operatorId => operatorId.Value,
        value => new(value));

    builder.Property(e => e.Name)
      .HasMaxLength(30)
      .IsRequired();
    builder.Property(e => e.Description)
      .HasMaxLength(100)
      .IsRequired();
    builder.HasMany(e => e.Phones);
  }
}