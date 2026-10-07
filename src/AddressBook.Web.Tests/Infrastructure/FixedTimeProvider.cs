namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// A <see cref="TimeProvider"/> that always returns the same instant and an optional local time zone.
/// It lets a test pin the clock that the birthday rule and the date picker read, without the
/// <c>Microsoft.Extensions.TimeProvider.Testing</c> package.
/// </summary>
/// <param name="utcNow">The instant <see cref="GetUtcNow"/> returns.</param>
/// <param name="localTimeZone">The zone <see cref="LocalTimeZone"/> returns; UTC when omitted.</param>
public sealed class FixedTimeProvider(DateTimeOffset utcNow, TimeZoneInfo? localTimeZone = null) : TimeProvider
{
    /// <summary>
    /// 2026-03-10 23:30 UTC: the UTC date is 2026-03-10 while a UTC+14 zone is already on 2026-03-11.
    /// </summary>
    public static readonly DateTimeOffset LateUtcEvening = new(2026, 3, 10, 23, 30, 0, TimeSpan.Zero);

    /// <summary>The UTC date at <see cref="LateUtcEvening"/>, at midnight.</summary>
    public static readonly DateTime LateUtcEveningUtcDate = new(2026, 3, 10);

    /// <summary>The local date at <see cref="LateUtcEvening"/> in a UTC+14 zone, at midnight - one day after the UTC date.</summary>
    public static readonly DateTime LateUtcEveningLocalDate = new(2026, 3, 11);

    /// <summary>
    /// A clock at <see cref="LateUtcEvening"/> whose local zone is UTC+14, so the local date is one day ahead
    /// of the UTC date.
    /// </summary>
    public static FixedTimeProvider LocalDayAheadOfUtc() =>
        new(LateUtcEvening, TimeZoneInfo.CreateCustomTimeZone("UTC+14", TimeSpan.FromHours(14), "UTC+14", "UTC+14"));

    /// <inheritdoc />
    public override DateTimeOffset GetUtcNow() => utcNow.ToUniversalTime();

    /// <inheritdoc />
    public override TimeZoneInfo LocalTimeZone => localTimeZone ?? TimeZoneInfo.Utc;
}
