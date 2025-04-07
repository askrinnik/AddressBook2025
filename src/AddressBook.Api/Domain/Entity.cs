namespace AddressBook.Api.Domain;

/// <summary>
/// Base class for entities
/// </summary>
/// <typeparam name="TId"></typeparam>
public class Entity<TId>
{
  /// <summary>
  /// Entity identifier
  /// </summary>
  public TId Id { get; set; } = default!;
}