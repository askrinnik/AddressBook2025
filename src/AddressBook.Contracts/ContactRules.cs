namespace AddressBook.Contracts;

/// <summary>
/// Validation rules of a contact that the API and the Web client share, so both sides
/// enforce the same limits and the same birthday rule.
/// </summary>
public static class ContactRules
{
  /// <summary>
  /// Maximum length of <c>FirstName</c> and <c>LastName</c>. The API validators, the database
  /// column size and the Web form model all read this value.
  /// </summary>
  public const int NameMaxLength = 30;

  /// <summary>
  /// Error message of the birthday rule, identical on the client and in the API's
  /// ProblemDetails <c>errors.Birthday</c>.
  /// </summary>
  public const string BirthdayInFutureMessage = "Birthday cannot be in the future";

  /// <summary>
  /// Returns the current date in UTC. Both sides compare against the UTC date, so the outcome
  /// does not depend on the time zone of the browser or the server.
  /// </summary>
  /// <param name="timeProvider">The clock to read.</param>
  /// <returns>The date part of <see cref="TimeProvider.GetUtcNow"/>.</returns>
  public static DateOnly TodayUtc(TimeProvider timeProvider)
  {
    ArgumentNullException.ThrowIfNull(timeProvider);

    return DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);
  }

  /// <summary>
  /// Checks the birthday rule: an empty birthday is valid; otherwise it must not be later than
  /// the current UTC date.
  /// </summary>
  /// <param name="birthday">The birthday to check.</param>
  /// <param name="timeProvider">The clock to read.</param>
  /// <returns><see langword="true"/> when the birthday is empty or not later than today (UTC).</returns>
  /// <example>
  /// <code>
  /// var valid = ContactRules.IsBirthdayNotInFuture(new DateOnly(1990, 5, 1), TimeProvider.System);
  /// </code>
  /// </example>
  public static bool IsBirthdayNotInFuture(DateOnly? birthday, TimeProvider timeProvider) =>
    birthday is not { } date || date <= TodayUtc(timeProvider);
}
