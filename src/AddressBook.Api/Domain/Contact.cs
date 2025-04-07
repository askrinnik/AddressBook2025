namespace AddressBook.Api.Domain;

/// <summary>
/// Contact entity
/// </summary>
public sealed class Contact : Entity<ContactId>
{
  /// <summary>
  /// Owner identifier
  /// </summary>
  public OwnerId OwnerId { get; set; } = OwnerId.Default();

  /// <summary>
  /// First name
  /// </summary>
  public string FirstName { get; set; } = string.Empty;

  /// <summary>
  /// Last name
  /// </summary>
  public string LastName { get; set; } = string.Empty;

  /// <summary>
  /// Birthday
  /// </summary>
  public DateTime? Birthday { get; set; }

  /// <summary>
  /// A collection of phones
  /// </summary>
  public List<Phone> Phones { get; set; } = [];
}
