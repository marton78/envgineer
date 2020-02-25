# envgineer: Pragmatic secrets management via encrypted .env files

With envgineer you can manage secrets in a repository without external tools such as Vault or AWS Secrets Manager. Encrypted .env-files can be safely tracked by a version control system, the only secret to be remembered or added to the CI is the encryption password. Encryption is performed using Node's built-in crypto module with AES-256.

## Usage

1. Create an `.env` file:
    ```bash
    $ cat <<EOF > .env
    USER=root
    PASS=letmein
    EOF
    ```

2. The command `envgineer e env.crypt` encrypts all values in the env-file to `env.crypt`. The encrypted file can then be added to the repository without revealing secrets. Only values are encrypted, keys are preserved in clear text for easy validation of a file's contents:

    ```bash
    $ envgineer e env.crypt
    Password: *********
    $ cat env.crypt 
    USER=db7NiFLSC/wsKNrfCNiFZtLKxR6Oj5xyAs2R74uitf1RvrJMbGVNZt5GYPA=
    PASS=R+DhEUDbhelChAUPzq9sN+niEj2MGu84clXcAwhVbnCBTmeGn78yn4OvdgCt/jU=
    ```

3. The command `envgineer d env.crypt` decrypts the encrypted env-file and writes its contents to `.env`, which can be then consumed by e.g. [dotenv](https://www.npmjs.com/package/dotenv) or [docker-compose](https://docs.docker.com/compose/environment-variables/). When used in scripts, the password can be piped into envgineer:

    ```bash
    $ rm .env
    $ echo secret123 | envgineer d env.crypt
    $ cat .env
    USER=root
    PASS=letmein
    ```

4. To update the encrypted file, just edit `.env` and encrypt it again. In order to have a meaningful output of `git diff`, envgineer will decrypt every value in the encrypted file and compare it with the unencrypted value. The encrypted representation of unchanged values will be preserved:

    ```bash
    $ sed -i '' 's/letmein/a_better_password/g' .env
    $ cat .env
    USER=root
    PASS=a_better_password
    $ echo secret123 | envgineer e env.crypt
    $ cat env.crypt 
    USER=db7NiFLSC/wsKNrfCNiFZtLKxR6Oj5xyAs2R74uitf1RvrJMbGVNZt5GYPA=
    PASS=Ljs9AaaG0UeUPJOyFJBXE/CgdK4lhxtWQlkshL4UVeOWcQxRiwexOTC/fKQU/n+VIgLJzWboUx0D
    ```
