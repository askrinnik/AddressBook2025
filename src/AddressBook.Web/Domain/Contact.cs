namespace AddressBook.Web.Domain;

/// <summary>
/// Contact entity
/// </summary>
public class Contact
{
  /// <summary>
  /// Contact identifier
  /// </summary>
  public int Id { get; set; }

  /// <summary>
  /// Owner identifier
  /// </summary>
  public int OwnerId { get; set; } = 1;

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
