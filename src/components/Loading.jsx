export default function Loading() {
  return (
    <div style={styles.overlay}>
      <div style={styles.contentWrapper}>
        
        {/* Symmetrical Animated Rods */}
        <div style={styles.barContainer}>
          {/* Left Short Rod */}
          <div style={{ ...styles.bar, height: '40px', animation: 'barGrowShort 1.2s ease-in-out infinite' }}></div>
          
          {/* Left Medium Rod */}
          <div style={{ ...styles.bar, height: '65px', animation: 'barGrowMedium 1.2s ease-in-out infinite', animationDelay: '0.15s' }}></div>
          
          {/* Center Tallest Rod */}
          <div style={{ ...styles.bar, height: '90px', animation: 'barGrowTall 1.2s ease-in-out infinite', animationDelay: '0.3s' }}></div>
          
          {/* Right Medium Rod (Matches Left) */}
          <div style={{ ...styles.bar, height: '65px', animation: 'barGrowMedium 1.2s ease-in-out infinite', animationDelay: '0.45s' }}></div>
          
          {/* Right Short Rod (Matches Left) */}
          <div style={{ ...styles.bar, height: '40px', animation: 'barGrowShort 1.2s ease-in-out infinite', animationDelay: '0.6s' }}></div>
        </div>
        
        {/* Loading Text */}
        <p style={styles.text}>Loading...</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#ffffff',
    zIndex: 9999,
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '28px', 
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center', // Centers them vertically relative to each other
    gap: '10px',   
    height: '160px', // Tall workspace to give the long bars space to breathe
  },
  bar: {
    width: '7px',
    backgroundColor: '#2d3748',
    borderRadius: '4px',
  },
  text: {
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a202c', // Dark charcoal/black text
    letterSpacing: '0.08em',
    textTransform: 'uppercase', // Gives it a clean, professional aesthetic
  }
};