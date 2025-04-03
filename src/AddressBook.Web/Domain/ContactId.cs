namespace AddressBook.Web.Domain;

/// <summary>
/// Contact identifier
/// </summary>
/// <param name="Value"></param>
public record ContactId(int Value)
{
  /// <summary>
  /// New contact identifier
  /// </summary>
  /// <returns></returns>
  public static ContactId New() => new(0);
}