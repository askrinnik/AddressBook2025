namespace AddressBook.Api.Domain;

/// <summary>
/// Contact identifier
/// </summary>
/// <param name="Value"></param>
public sealed record ContactId(int Value)
{
  /// <summary>
  /// New contact identifier
  /// </summary>
  /// <returns></returns>
  public static ContactId New() => new(0);
}